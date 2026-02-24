import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase";
import { ReceiptViewer } from "@/components/receipt-viewer";
import { formatCurrency, formatDateLong, formatTimestamp } from "@/lib/format";
import { STATUS_STYLES, STATUS_LABELS } from "@/lib/status";
import type { Expense } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const expense = data as Expense;

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <Link
        href="/expenses"
        className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Back to expenses
      </Link>

      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground mb-6">
            {expense.merchant ?? "Unknown Merchant"}
          </h1>

          <dl className="space-y-5">
            <div className="flex items-baseline justify-between border-b border-border pb-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</dt>
              <dd className="font-medium">{formatDateLong(expense.date)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-b border-border pb-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</dt>
              <dd className="font-serif text-xl font-bold">
                {formatCurrency(expense.amount)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between border-b border-border pb-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</dt>
              <dd className="capitalize">
                {expense.category?.replace(/_/g, " ") ?? "-"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between border-b border-border pb-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</dt>
              <dd>
                <span
                  className={`text-xs px-2.5 py-1 font-medium ${STATUS_STYLES[expense.status]}`}
                >
                  {STATUS_LABELS[expense.status]}
                </span>
              </dd>
            </div>
            <div className="flex items-baseline justify-between border-b border-border pb-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Submitted by</dt>
              <dd>{expense.sender_name ?? "-"}</dd>
            </div>
            <div className="flex items-baseline justify-between border-b border-border pb-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Submitted at</dt>
              <dd>
                {new Date(expense.submitted_at).toLocaleString("en-US")}
              </dd>
            </div>
            {expense.approved_at && (
              <div className="flex items-baseline justify-between border-b border-border pb-4">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approved at</dt>
                <dd>{formatTimestamp(expense.approved_at)}</dd>
              </div>
            )}
            {expense.reimbursed_at && (
              <div className="flex items-baseline justify-between border-b border-border pb-4">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reimbursed at</dt>
                <dd>{formatTimestamp(expense.reimbursed_at)}</dd>
              </div>
            )}
          </dl>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Receipt</h2>
          {expense.receipt_url ? (
            <ReceiptViewer url={expense.receipt_url} />
          ) : (
            <div className="border border-border p-12 text-center text-muted-foreground">
              No receipt image available
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
