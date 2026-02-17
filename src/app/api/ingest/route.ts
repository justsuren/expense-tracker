import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { parseReceipt } from "@/lib/parse-receipt";
import { uploadReceipt } from "@/lib/storage";

const SUPPORTED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const senderEmail = extractEmail(
      formData.get("from")?.toString() ?? ""
    );
    const attachmentInfoRaw = formData.get("attachment-info")?.toString();

    if (!attachmentInfoRaw) {
      console.log("Ingest: No attachments found in email from", senderEmail);
      return NextResponse.json({ processed: 0 });
    }

    const attachmentInfo: Record<
      string,
      { filename: string; type: string }
    > = JSON.parse(attachmentInfoRaw);

    const supabase = createServiceClient();
    const results: Array<{ expense_id: string; status: string }> = [];

    for (const key of Object.keys(attachmentInfo)) {
      const file = formData.get(key) as File | null;
      if (!file) continue;

      if (!SUPPORTED_TYPES.has(file.type)) {
        console.log(`Ingest: Skipping unsupported file type: ${file.type}`);
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to storage and parse with AI in parallel
      const [receiptUrl, parsed] = await Promise.all([
        uploadReceipt(supabase, buffer, file.type),
        parseReceipt(buffer, file.type),
      ]);

      const status = parsed.confidence >= 0.8 ? "pending" : "needs_review";

      const { data, error } = await supabase
        .from("expenses")
        .insert({
          date: parsed.date,
          amount: parsed.amount,
          merchant: parsed.merchant,
          category: parsed.category,
          status,
          receipt_url: receiptUrl,
          raw_ai_data: parsed,
          sender_email: senderEmail,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Ingest: DB insert failed:", error);
        continue;
      }

      results.push({ expense_id: data.id, status });
    }

    console.log(
      `Ingest: Processed ${results.length} receipts from ${senderEmail}`
    );
    return NextResponse.json({ processed: results.length, results });
  } catch (error) {
    console.error("Ingest error:", error);
    // Always return 200 to prevent SendGrid retries
    return NextResponse.json(
      { error: "Processing failed", detail: String(error) },
      { status: 200 }
    );
  }
}

function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from.trim();
}
