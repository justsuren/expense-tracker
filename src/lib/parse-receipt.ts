import { getAnthropicClient } from "@/lib/anthropic";
import { CATEGORIES } from "@/lib/categories";
import type { ParsedReceipt } from "@/lib/types";

const RECEIPT_PARSING_PROMPT = `You are an expense document parsing assistant. Analyze this image which may be a receipt, check, invoice, or other financial document.

First, determine what type of document this is, then extract the relevant information.

Return ONLY a JSON object with these fields:
{
  "document_type": "receipt | check | invoice | other",
  "date": "YYYY-MM-DD format, or null if not found",
  "merchant": "Store/business name OR payee/pay-to name for checks, or null if not found",
  "amount": 123.45,
  "category": "One of: ${CATEGORIES.join(", ")}",
  "confidence": 0.95
}

Rules:
- For receipts: extract the TOTAL amount (after tax), not subtotal. Use the transaction date, not the print date.
- For checks: extract the check amount (numeric amount, not the written-out words). Use the payee ("Pay to the order of") as the merchant. Use the check date.
- For invoices: extract the total due. Use the vendor as the merchant.
- Return amount as a number, or null if not found.
- For category, choose the most specific match from the list. For checks, infer from the payee name or memo line if available.
- Set confidence lower if the document is blurry, partially visible, or ambiguous
- If you cannot determine a field, set it to null and lower confidence accordingly
- Return ONLY the JSON object, no other text`;

export async function parseReceipt(
  fileBuffer: Buffer,
  mimeType: string
): Promise<ParsedReceipt> {
  const base64 = fileBuffer.toString("base64");

  try {
    const anthropic = getAnthropicClient();
    const content: Parameters<typeof anthropic.messages.create>[0]["messages"][0]["content"] =
      mimeType === "application/pdf"
        ? [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            { type: "text", text: RECEIPT_PARSING_PROMPT },
          ]
        : [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/gif"
                  | "image/webp",
                data: base64,
              },
            },
            { type: "text", text: RECEIPT_PARSING_PROMPT },
          ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    console.log("AI response:", JSON.stringify(response.content));

    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text block in AI response");
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`No JSON found in AI response: ${textBlock.text}`);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log("Parsed document:", parsed);
    const docType = parsed.document_type ?? "other";
    return {
      document_type: ["receipt", "check", "invoice", "other"].includes(docType) ? docType : "other",
      date: parsed.date ?? null,
      merchant: parsed.merchant ?? null,
      amount: parsed.amount != null ? Number(parsed.amount) : null,
      category: parsed.category ?? null,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
    };
  } catch (error) {
    console.error("Receipt parsing error:", error);
    throw new Error(
      `Failed to parse document: ${error instanceof Error ? error.message : "unknown error"}`
    );
  }
}
