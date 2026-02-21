import { getAnthropicClient } from "@/lib/anthropic";
import { CATEGORIES } from "@/lib/categories";
import type { ParsedReceipt } from "@/lib/types";

const RECEIPT_PARSING_PROMPT = `You are a receipt parsing assistant. Analyze this receipt image and extract the following information.

Return ONLY a JSON object with these fields:
{
  "date": "YYYY-MM-DD format, or null if not found",
  "merchant": "Store/business name, or null if not found",
  "amount": 123.45,
  "category": "One of: ${CATEGORIES.join(", ")}",
  "confidence": 0.95
}

Rules:
- Extract the TOTAL amount (after tax), not subtotal. Return as a number, or null if not found.
- Use the transaction date, not the print date
- For category, choose the most specific match from the list
- Set confidence lower if the receipt is blurry, partially visible, or ambiguous
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
      console.error("No text block in AI response");
      return fallbackResult();
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in AI response:", textBlock.text);
      return fallbackResult();
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log("Parsed receipt:", parsed);
    return {
      date: parsed.date ?? null,
      merchant: parsed.merchant ?? null,
      amount: parsed.amount != null ? Number(parsed.amount) : null,
      category: parsed.category ?? null,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
    };
  } catch (error) {
    console.error("Receipt parsing error:", error);
    return fallbackResult();
  }
}

function fallbackResult(): ParsedReceipt {
  return {
    date: null,
    merchant: null,
    amount: null,
    category: null,
    confidence: 0,
  };
}
