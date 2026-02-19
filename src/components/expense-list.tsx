"use client";

import Link from "next/link";
import { useState } from "react";
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

const STATUS_STYLES: Record<Expense["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  needs_review: "bg-red-100 text-red-800",
  approved: "bg-green-100 text-green-800",
  reimbursed: "bg-blue-100 text-blue-800",
};

const STATUS_LABELS: Record<Expense["status"], string> = {
  pending: "Pending",
  needs_review: "Needs Review",
  approved: "Approved",
  reimbursed: "Reimbursed",
};

function StatusBadge({ status }: { status: Expense["status"] }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function ExpenseList({ expenses: initial }: { expenses: Expense[] }) {
  const [expenses, setExpenses] = useState(initial);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-2">No expenses found</p>
        <p className="text-sm">
          Send a receipt photo to the Telegram bot to get started
        </p>
      </div>
    );
  }

  const allSelected =
    expenses.length > 0 && selected.size === expenses.length;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(expenses.map((e) => e.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkUpdate(status: "approved" | "reimbursed") {
    if (selected.size === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), status }),
      });
      if (res.ok) {
        const { updated } = await res.json();
        const updatedMap = new Map(
          (updated as { id: string; status: Expense["status"] }[]).map((u) => [
            u.id,
            u.status,
          ])
        );
        setExpenses((prev) =>
          prev.map((e) =>
            updatedMap.has(e.id) ? { ...e, status: updatedMap.get(e.id)! } : e
          )
        );
        setSelected(new Set());
      }
    } finally {
      setLoading(false);
    }
  }

  // Determine which bulk actions are available based on selected expenses
  const selectedExpenses = expenses.filter((e) => selected.has(e.id));
  const canApprove = selectedExpenses.some(
    (e) => e.status === "pending" || e.status === "needs_review"
  );
  const canReimburse = selectedExpenses.some((e) => e.status === "approved");

  return (
    <div>
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-sm text-gray-600">
            {selected.size} selected
          </span>
          {canApprove && (
            <button
              onClick={() => bulkUpdate("approved")}
              disabled={loading}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Approve"}
            </button>
          )}
          {canReimburse && (
            <button
              onClick={() => bulkUpdate("reimbursed")}
              disabled={loading}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Mark Reimbursed"}
            </button>
          )}
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-gray-500 hover:text-gray-700 ml-auto"
          >
            Clear selection
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="pb-2 pr-2 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="pb-2 pr-4 font-medium">Date</th>
              <th className="pb-2 pr-4 font-medium">Who</th>
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
                className={`border-b border-gray-100 hover:bg-gray-50 ${
                  selected.has(expense.id) ? "bg-blue-50" : ""
                }`}
              >
                <td className="py-3 pr-2">
                  <input
                    type="checkbox"
                    checked={selected.has(expense.id)}
                    onChange={() => toggleOne(expense.id)}
                    className="rounded"
                  />
                </td>
                <td className="py-3 pr-4">{formatDate(expense.date)}</td>
                <td className="py-3 pr-4">{expense.sender_name ?? "-"}</td>
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
    </div>
  );
}
