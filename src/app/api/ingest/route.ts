import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { parseReceipt } from "@/lib/parse-receipt";
import { uploadReceipt } from "@/lib/storage";
import { sendTelegramMessage, downloadTelegramFile, getOutstandingSummary } from "@/lib/telegram";

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from?: { first_name?: string; last_name?: string; username?: string };
    photo?: Array<{ file_id: string; file_size?: number }>;
    document?: { file_id: string; mime_type?: string; file_name?: string };
    text?: string;
  };
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

    // Get the file_id and mime type — for photos, use the largest resolution (last in array)
    let fileId: string | null = null;
    let mimeType = "image/jpeg";

    if (message.photo && message.photo.length > 0) {
      fileId = message.photo[message.photo.length - 1].file_id;
    } else if (message.document) {
      const mime = message.document.mime_type ?? "";
      if (mime.startsWith("image/") || mime === "application/pdf") {
        fileId = message.document.file_id;
        mimeType = mime;
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

    await sendTelegramMessage(chatId, "Got it! Processing your document...");

    const buffer = await downloadTelegramFile(fileId);
    if (!buffer) {
      await sendTelegramMessage(
        chatId,
        "Sorry, I couldn't download that file. Please try again."
      );
      return NextResponse.json({ ok: true });
    }

    const supabase = createServiceClient();

    let parsed;
    try {
      parsed = await parseReceipt(buffer, mimeType);
    } catch (parseError) {
      console.error("Parse failed:", parseError);
      await sendTelegramMessage(
        chatId,
        "Sorry, I couldn't read that document. Please try again with a clearer photo."
      );
      return NextResponse.json({ ok: true });
    }

    const receiptUrl = await uploadReceipt(supabase, buffer, mimeType, {
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

    // Send confirmation with document-type-aware labels
    const isCheck = parsed.document_type === "check";
    const docLabel = isCheck ? "Check" : "Receipt";
    const parts: string[] = [`${docLabel} logged!`];
    if (parsed.merchant) parts.push(`${isCheck ? "Payee" : "Merchant"}: ${parsed.merchant}`);
    if (parsed.amount != null) parts.push(`Amount: $${parsed.amount.toFixed(2)}`);
    if (parsed.date) parts.push(`Date: ${parsed.date}`);
    if (parsed.category) parts.push(`Category: ${parsed.category.replace(/_/g, " ")}`);
    if (status === "needs_review") {
      parts.push("\nSome fields couldn't be read clearly — marked for review.");
    }

    await sendTelegramMessage(chatId, parts.join("\n"));
    const outstanding = await getOutstandingSummary(chatId);
    if (outstanding) {
      await sendTelegramMessage(chatId, outstanding, "MarkdownV2");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}
