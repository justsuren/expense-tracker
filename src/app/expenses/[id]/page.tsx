import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase";
import { ReceiptViewer } from "@/components/receipt-viewer";
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

  const formatCurrency = (amount: number | null) => {
    if (amount == null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

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
              <dd className="font-medium">{formatDate(expense.date)}</dd>
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
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    expense.status === "pending"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {expense.status === "pending" ? "Pending" : "Needs Review"}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Submitted by</dt>
              <dd>{expense.sender_email ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Submitted at</dt>
              <dd>
                {new Date(expense.submitted_at).toLocaleString("en-US")}
              </dd>
            </div>
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
