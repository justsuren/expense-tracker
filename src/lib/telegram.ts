import { createServiceClient } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/format";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  needs_review: "Under review",
  approved: "Approved",
};

export async function sendTelegramMessage(
  chatId: number,
  text: string,
  parseMode?: "MarkdownV2"
) {
  const body: Record<string, unknown> = { chat_id: chatId, text };
  if (parseMode) body.parse_mode = parseMode;
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function downloadTelegramFile(
  fileId: string
): Promise<Buffer | null> {
  const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
  const fileData = await fileRes.json();

  if (!fileData.ok || !fileData.result?.file_path) {
    return null;
  }

  const downloadRes = await fetch(
    `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`
  );

  if (!downloadRes.ok) {
    return null;
  }

  return Buffer.from(await downloadRes.arrayBuffer());
}

const MAX_OUTSTANDING_ROWS = 10;

export async function getOutstandingSummary(chatId: number): Promise<string> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("expenses")
    .select("amount, submitted_at, status")
    .eq("telegram_chat_id", chatId)
    .eq("archived", false)
    .in("status", ["pending", "needs_review", "approved"])
    .order("submitted_at", { ascending: false });

  if (error || !data || data.length === 0) return "";

  const pad = (s: string, w: number) => s.padEnd(w);

  const visible = data.slice(0, MAX_OUTSTANDING_ROWS);

  // Compute column widths from data so dividers always align
  const cols = visible.map((e) => ({
    amount: formatCurrency(e.amount),
    date: formatDate(e.submitted_at?.slice(0, 10) ?? null),
    status: STATUS_LABELS[e.status] ?? e.status,
  }));

  const w1 = Math.max("Amount".length, ...cols.map((c) => c.amount.length));
  const w2 = Math.max("Submitted".length, ...cols.map((c) => c.date.length));
  const w3 = Math.max("Status".length, ...cols.map((c) => c.status.length));

  const headerRow = `${pad("Amount", w1)} | ${pad("Submitted", w2)} | ${pad("Status", w3)}`;
  const rows = cols.map(
    (c) => `${pad(c.amount, w1)} | ${pad(c.date, w2)} | ${c.status}`
  );

  let table = `${headerRow}\n${rows.join("\n")}`;
  if (data.length > MAX_OUTSTANDING_ROWS) {
    table += `\n...and ${data.length - MAX_OUTSTANDING_ROWS} more`;
  }

  return `Outstanding expenses:\n\`\`\`\n${table}\n\`\`\``;
}
