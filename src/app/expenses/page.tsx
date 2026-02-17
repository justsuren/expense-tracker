import { Suspense } from "react";
import { createServiceClient } from "@/lib/supabase";
import { ExpenseList } from "@/components/expense-list";
import { DateFilter } from "@/components/date-filter";
import type { Expense } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const supabase = createServiceClient();

  let query = supabase
    .from("expenses")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(50);

  if (params.start) {
    query = query.gte("date", params.start);
  }
  if (params.end) {
    query = query.lte("date", params.end);
  }

  const { data: expenses } = await query;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Expenses</h1>
      <Suspense>
        <DateFilter currentStart={params.start} currentEnd={params.end} />
      </Suspense>
      <ExpenseList expenses={(expenses as Expense[]) ?? []} />
    </main>
  );
}
