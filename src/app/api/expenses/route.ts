import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { CATEGORY_SET } from "@/lib/categories";
import { buildExpenseQuery } from "@/lib/queries";
import { sendTelegramMessage, getOutstandingSummary } from "@/lib/telegram";
import { formatCurrency, formatDate } from "@/lib/format";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const supabase = createServiceClient();

  const { query, pagination } = buildExpenseQuery(supabase, {
    start: sp.get("start"),
    end: sp.get("end"),
    status: sp.get("status"),
    who: sp.get("who"),
    categories: sp.get("categories"),
    archived: sp.get("archived"),
    limit: Number(sp.get("limit") ?? 50),
    offset: Number(sp.get("offset") ?? 0),
  });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expenses: data, pagination });
}

const VALID_STATUSES = new Set(["pending", "needs_review", "approved", "reimbursed"]);

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { ids, status, action, category } = body as {
    ids: string[];
    status?: string;
    action?: "archive" | "unarchive";
    category?: string;
  };

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Archive / unarchive action
  if (action === "archive" || action === "unarchive") {
    const updateData: Record<string, unknown> = {
      archived: action === "archive",
      archived_at: action === "archive" ? new Date().toISOString() : null,
    };
    const { data, error } = await supabase
      .from("expenses")
      .update(updateData)
      .in("id", ids)
      .select("id, archived");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ updated: data });
  }

  // Category update action
  if (category) {
    if (!CATEGORY_SET.has(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("expenses")
      .update({ category })
      .in("id", ids)
      .select("id, category");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ updated: data });
  }

  // Status update
  if (!status || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { status };
  if (status === "approved") {
    updateData.approved_at = new Date().toISOString();
  } else if (status === "reimbursed") {
    updateData.reimbursed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("expenses")
    .update(updateData)
    .in("id", ids)
    .select("id, status, amount, date, merchant, telegram_chat_id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send Telegram notifications for approved/reimbursed status changes
  if (status === "approved" || status === "reimbursed") {
    const label = status === "approved" ? "approved" : "reimbursed";

    // Group expenses by telegram_chat_id
    const byChatId = new Map<number, typeof data>();
    for (const expense of data ?? []) {
      if (!expense.telegram_chat_id) continue;
      const chatId = expense.telegram_chat_id as number;
      if (!byChatId.has(chatId)) byChatId.set(chatId, []);
      byChatId.get(chatId)!.push(expense);
    }

    // Send a message to each chat (fire-and-forget)
    const notifications = Array.from(byChatId.entries()).map(
      async ([chatId, expenses]) => {
        const lines = expenses.map(
          (e) =>
            `* ${formatCurrency(e.amount)} as of ${formatDate(e.date)} at ${e.merchant ?? "Unknown"}`
        );
        const outstanding = await getOutstandingSummary(chatId);
        const text = `The following expenses were ${label}:\n${lines.join("\n")}${outstanding}`;
        return sendTelegramMessage(chatId, text).catch((err) =>
          console.error(`Failed to notify chat ${chatId}:`, err)
        );
      }
    );
    await Promise.all(notifications);
  }

  return NextResponse.json({ updated: data });
}
