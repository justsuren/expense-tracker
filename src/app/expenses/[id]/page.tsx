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
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/expenses"
        className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block"
      >
        &larr; Back to expenses
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h1 className="text-2xl font-bold mb-4">
            {expense.merchant ?? "Unknown Merchant"}
          </h1>

          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Date</dt>
              <dd className="font-medium">{formatDateLong(expense.date)}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Amount</dt>
              <dd className="text-xl font-semibold">
                {formatCurrency(expense.amount)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Category</dt>
              <dd className="capitalize">
                {expense.category?.replace(/_/g, " ") ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Status</dt>
              <dd>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[expense.status]}`}
                >
                  {STATUS_LABELS[expense.status]}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Submitted by</dt>
              <dd>{expense.sender_name ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Submitted at</dt>
              <dd>
                {new Date(expense.submitted_at).toLocaleString("en-US")}
              </dd>
            </div>
            {expense.approved_at && (
              <div>
                <dt className="text-sm text-gray-500">Approved at</dt>
                <dd>{formatTimestamp(expense.approved_at)}</dd>
              </div>
            )}
            {expense.reimbursed_at && (
              <div>
                <dt className="text-sm text-gray-500">Reimbursed at</dt>
                <dd>{formatTimestamp(expense.reimbursed_at)}</dd>
              </div>
            )}
          </dl>
        </div>

        <div>
          <h2 className="text-sm text-gray-500 mb-2">Receipt</h2>
          {expense.receipt_url ? (
            <ReceiptViewer url={expense.receipt_url} />
          ) : (
            <div className="border border-gray-200 rounded p-8 text-center text-gray-400">
              No receipt image available
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
