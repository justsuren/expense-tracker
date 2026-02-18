import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { parseReceipt } from "@/lib/parse-receipt";
import { uploadReceipt } from "@/lib/storage";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from?: { first_name?: string; last_name?: string; username?: string };
    photo?: Array<{ file_id: string; file_size?: number }>;
    document?: { file_id: string; mime_type?: string; file_name?: string };
    text?: string;
  };
}

async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function downloadTelegramFile(
  fileId: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  // Get file path from Telegram
  const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
  const fileData = await fileRes.json();

  if (!fileData.ok || !fileData.result?.file_path) {
    return null;
  }

  const filePath: string = fileData.result.file_path;

  // Download the file
  const downloadRes = await fetch(
    `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`
  );

  if (!downloadRes.ok) {
    return null;
  }

  const arrayBuffer = await downloadRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Determine mime type from file extension
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    pdf: "application/pdf",
  };
  const mimeType = mimeMap[ext] ?? "image/jpeg";

  return { buffer, mimeType };
}

export async function POST(request: Request) {
  try {
    const update: TelegramUpdate = await request.json();
    const message = update.message;

    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const firstName = message.from?.first_name ?? "";
    const lastName = message.from?.last_name ?? "";
    const senderName =
      `${firstName} ${lastName}`.trim() ||
      message.from?.username ||
      "Unknown";

    // Handle text messages (no photo)
    if (message.text && !message.photo && !message.document) {
      await sendTelegramMessage(
        chatId,
        "Hi! Send me a photo of a receipt and I'll log it as an expense."
      );
      return NextResponse.json({ ok: true });
    }

    // Get the file_id — for photos, use the largest resolution (last in array)
    let fileId: string | null = null;

    if (message.photo && message.photo.length > 0) {
      fileId = message.photo[message.photo.length - 1].file_id;
    } else if (message.document) {
      const mime = message.document.mime_type ?? "";
      if (
        mime.startsWith("image/") ||
        mime === "application/pdf"
      ) {
        fileId = message.document.file_id;
      } else {
        await sendTelegramMessage(
          chatId,
          "Please send a photo or PDF of your receipt."
        );
        return NextResponse.json({ ok: true });
      }
    }

    if (!fileId) {
      return NextResponse.json({ ok: true });
    }

    await sendTelegramMessage(chatId, "Got it! Processing your receipt...");

    // Download file from Telegram
    const file = await downloadTelegramFile(fileId);
    if (!file) {
      await sendTelegramMessage(
        chatId,
        "Sorry, I couldn't download that file. Please try again."
      );
      return NextResponse.json({ ok: true });
    }

    const supabase = createServiceClient();

    // Parse first so we have merchant/date for the filename
    const parsed = await parseReceipt(file.buffer, file.mimeType);

    const receiptUrl = await uploadReceipt(supabase, file.buffer, file.mimeType, {
      date: parsed.date,
      senderName: senderName,
      merchant: parsed.merchant,
    });

    const status = parsed.confidence >= 0.8 ? "pending" : "needs_review";

    const { error } = await supabase.from("expenses").insert({
      date: parsed.date,
      amount: parsed.amount,
      merchant: parsed.merchant,
      category: parsed.category,
      status,
      receipt_url: receiptUrl,
      raw_ai_data: parsed,
      sender_name: senderName,
      telegram_chat_id: chatId,
    });

    if (error) {
      console.error("DB insert failed:", error);
      await sendTelegramMessage(
        chatId,
        "Sorry, something went wrong saving your expense. Please try again."
      );
      return NextResponse.json({ ok: true });
    }

    // Send confirmation
    const parts: string[] = ["Receipt logged!"];
    if (parsed.merchant) parts.push(`Merchant: ${parsed.merchant}`);
    if (parsed.amount != null) parts.push(`Amount: $${parsed.amount.toFixed(2)}`);
    if (parsed.date) parts.push(`Date: ${parsed.date}`);
    if (parsed.category) parts.push(`Category: ${parsed.category.replace(/_/g, " ")}`);
    if (status === "needs_review") {
      parts.push("\nSome fields couldn't be read clearly — marked for review.");
    }

    await sendTelegramMessage(chatId, parts.join("\n"));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}
