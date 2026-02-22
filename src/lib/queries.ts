import type { SupabaseClient } from "@supabase/supabase-js";

export interface ExpenseFilters {
  start?: string | null;
  end?: string | null;
  status?: string | null;
  who?: string | null;
  categories?: string | null;
  archived?: string | null;
  limit?: number;
  offset?: number;
}

export function buildExpenseQuery(supabase: SupabaseClient, filters: ExpenseFilters) {
  const limit = Math.min(filters.limit ?? 50, 100);
  const offset = filters.offset ?? 0;

  let query = supabase
    .from("expenses")
    .select("*")
    .order("submitted_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.start) query = query.gte("date", filters.start);
  if (filters.end) query = query.lte("date", filters.end);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.who) query = query.eq("sender_name", filters.who);
  if (filters.categories) {
    const cats = filters.categories.split(",").filter(Boolean);
    if (cats.length > 0) query = query.in("category", cats);
  }

  if (filters.archived === "true") {
    query = query.eq("archived", true);
  } else {
    query = query.eq("archived", false);
  }

  return { query, pagination: { limit, offset } };
}
