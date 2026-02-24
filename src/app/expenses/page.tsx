import { Suspense } from "react";
import { createServiceClient } from "@/lib/supabase";
import { buildExpenseQuery } from "@/lib/queries";
import { ExpenseList } from "@/components/expense-list";
import { DateFilter } from "@/components/date-filter";
import type { Expense } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string; status?: string; who?: string; categories?: string; archived?: string }>;
}) {
  const params = await searchParams;
  const supabase = createServiceClient();

  // Fetch distinct sender names for the "Who" filter dropdown
  const { data: senderRows } = await supabase
    .from("expenses")
    .select("sender_name")
    .not("sender_name", "is", null)
    .order("sender_name");

  const senderNames = [
    ...new Set(
      (senderRows ?? [])
        .map((r: { sender_name: string | null }) => r.sender_name)
        .filter(Boolean) as string[]
    ),
  ];

  const { query } = buildExpenseQuery(supabase, params);
  const { data: expenses } = await query;

  // Key forces React to remount ExpenseList when filters change,
  // so client state (checkboxes, selections) resets with fresh data
  const filterKey = [params.start, params.end, params.status, params.who, params.categories, params.archived]
    .filter(Boolean)
    .join("-") || "all";

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground">Expenses</h1>
        <p className="mt-2 text-sm text-muted-foreground">Track and manage your submitted expenses</p>
      </div>
      <Suspense>
        <DateFilter
          currentStart={params.start}
          currentEnd={params.end}
          currentStatus={params.status}
          currentWho={params.who}
          currentCategories={params.categories}
          currentArchived={params.archived}
          senderNames={senderNames}
        />
      </Suspense>
      <ExpenseList key={filterKey} expenses={(expenses as Expense[]) ?? []} archiveMode={params.archived === "true"} />
    </main>
  );
}
