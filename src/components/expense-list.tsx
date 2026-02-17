import Link from "next/link";
import type { Expense } from "@/lib/types";

function formatCurrency(amount: number | null): string {
  if (amount == null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(date: string | null): string {
  if (!date) return "-";
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: Expense["status"] }) {
  const styles =
    status === "pending"
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";
  const label = status === "pending" ? "Pending" : "Needs Review";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles}`}>
      {label}
    </span>
  );
}

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-2">No expenses found</p>
        <p className="text-sm">
          Email a receipt to submit@alignpartners.ai to get started
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-600">
            <th className="pb-2 pr-4 font-medium">Date</th>
            <th className="pb-2 pr-4 font-medium">Merchant</th>
            <th className="pb-2 pr-4 font-medium text-right">Amount</th>
            <th className="pb-2 pr-4 font-medium">Category</th>
            <th className="pb-2 pr-4 font-medium">Status</th>
            <th className="pb-2 font-medium">Receipt</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr
              key={expense.id}
              className="border-b border-gray-100 hover:bg-gray-50"
            >
              <td className="py-3 pr-4">{formatDate(expense.date)}</td>
              <td className="py-3 pr-4 font-medium">
                <Link
                  href={`/expenses/${expense.id}`}
                  className="hover:underline"
                >
                  {expense.merchant ?? "Unknown"}
                </Link>
              </td>
              <td className="py-3 pr-4 text-right tabular-nums">
                {formatCurrency(expense.amount)}
              </td>
              <td className="py-3 pr-4 capitalize">
                {expense.category?.replace(/_/g, " ") ?? "-"}
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={expense.status} />
              </td>
              <td className="py-3">
                {expense.receipt_url ? (
                  <Link
                    href={`/expenses/${expense.id}`}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    View
                  </Link>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
