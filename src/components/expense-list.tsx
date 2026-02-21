"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { Expense } from "@/lib/types";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/categories";

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

const STATUS_ORDER: Record<Expense["status"], number> = {
  pending: 0,
  needs_review: 1,
  approved: 2,
  reimbursed: 3,
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

type SortField = "date" | "sender_name" | "merchant" | "amount" | "category" | "status";
type SortDir = "asc" | "desc";

function SortArrow({
  field,
  activeField,
  direction,
}: {
  field: SortField;
  activeField: SortField | null;
  direction: SortDir;
}) {
  const isActive = field === activeField;
  return (
    <span
      className={`inline-block ml-1 text-[10px] transition-opacity ${
        isActive ? "opacity-100 text-gray-800" : "opacity-0 group-hover:opacity-40 text-gray-400"
      }`}
    >
      {isActive && direction === "desc" ? "▼" : "▲"}
    </span>
  );
}

function compareValues(a: Expense, b: Expense, field: SortField, dir: SortDir): number {
  let cmp = 0;
  switch (field) {
    case "date":
      cmp = (a.date ?? "").localeCompare(b.date ?? "");
      break;
    case "sender_name":
      cmp = (a.sender_name ?? "").localeCompare(b.sender_name ?? "");
      break;
    case "merchant":
      cmp = (a.merchant ?? "").localeCompare(b.merchant ?? "");
      break;
    case "amount":
      cmp = (a.amount ?? 0) - (b.amount ?? 0);
      break;
    case "category":
      cmp = (a.category ?? "").localeCompare(b.category ?? "");
      break;
    case "status":
      cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      break;
  }
  return dir === "asc" ? cmp : -cmp;
}

export function ExpenseList({
  expenses: initial,
  archiveMode = false,
}: {
  expenses: Expense[];
  archiveMode?: boolean;
}) {
  const [expenses, setExpenses] = useState(initial);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    if (!sortField) return expenses;
    return [...expenses].sort((a, b) => compareValues(a, b, sortField, sortDir));
  }, [expenses, sortField, sortDir]);

  const total = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0),
    [expenses]
  );

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

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
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

  async function bulkArchive(archive: boolean) {
    if (selected.size === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selected),
          action: archive ? "archive" : "unarchive",
        }),
      });
      if (res.ok) {
        setExpenses((prev) => prev.filter((e) => !selected.has(e.id)));
        setSelected(new Set());
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateCategory(ids: string[], category: string) {
    if (ids.length === 0 || !category) return;
    setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, category }),
      });
      if (res.ok) {
        const { updated } = await res.json();
        const updatedMap = new Map(
          (updated as { id: string; category: string }[]).map((u) => [
            u.id,
            u.category,
          ])
        );
        setExpenses((prev) =>
          prev.map((e) =>
            updatedMap.has(e.id) ? { ...e, category: updatedMap.get(e.id)! } : e
          )
        );
        setSelected(new Set());
        setEditingCategoryId(null);
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
          <select
            value=""
            onChange={(e) => updateCategory(Array.from(selected), e.target.value)}
            disabled={loading}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white disabled:opacity-50"
          >
            <option value="" disabled>
              Change Category...
            </option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
          <button
            onClick={() => bulkArchive(!archiveMode)}
            disabled={loading}
            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? "Updating..." : archiveMode ? "Unarchive" : "Archive"}
          </button>
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
              <th
                className="pb-2 pr-4 font-medium cursor-pointer select-none group"
                onClick={() => handleSort("date")}
              >
                Date
                <SortArrow field="date" activeField={sortField} direction={sortDir} />
              </th>
              <th
                className="pb-2 pr-4 font-medium cursor-pointer select-none group"
                onClick={() => handleSort("sender_name")}
              >
                Who
                <SortArrow field="sender_name" activeField={sortField} direction={sortDir} />
              </th>
              <th
                className="pb-2 pr-4 font-medium cursor-pointer select-none group"
                onClick={() => handleSort("merchant")}
              >
                Merchant
                <SortArrow field="merchant" activeField={sortField} direction={sortDir} />
              </th>
              <th
                className="pb-2 pr-4 font-medium text-right cursor-pointer select-none group"
                onClick={() => handleSort("amount")}
              >
                Amount
                <SortArrow field="amount" activeField={sortField} direction={sortDir} />
              </th>
              <th
                className="pb-2 pr-4 font-medium cursor-pointer select-none group"
                onClick={() => handleSort("category")}
              >
                Category
                <SortArrow field="category" activeField={sortField} direction={sortDir} />
              </th>
              <th
                className="pb-2 pr-4 font-medium cursor-pointer select-none group"
                onClick={() => handleSort("status")}
              >
                Status
                <SortArrow field="status" activeField={sortField} direction={sortDir} />
              </th>
              <th className="pb-2 font-medium">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((expense) => (
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
                <td className="py-3 pr-4">
                  {editingCategoryId === expense.id ? (
                    <select
                      autoFocus
                      value={expense.category ?? ""}
                      onChange={(e) => updateCategory([expense.id], e.target.value)}
                      onBlur={() => setEditingCategoryId(null)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingCategoryId(null);
                      }}
                      className="border border-blue-400 rounded px-1 py-0.5 text-sm bg-white w-full"
                    >
                      <option value="" disabled>
                        Select...
                      </option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      onClick={() => setEditingCategoryId(expense.id)}
                      className="capitalize cursor-pointer hover:text-blue-600 hover:underline"
                      title="Click to change category"
                    >
                      {expense.category?.replace(/_/g, " ") ?? "-"}
                    </span>
                  )}
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
          <tfoot>
            <tr className="border-t-2 border-gray-300">
              <td colSpan={4} className="py-3 pr-4 text-right font-semibold text-gray-600">
                Total
              </td>
              <td className="py-3 pr-4 text-right tabular-nums font-semibold">
                {formatCurrency(total)}
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
