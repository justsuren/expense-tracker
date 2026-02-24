"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Expense } from "@/lib/types";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/categories";
import { formatCurrency, formatDate } from "@/lib/format";
import { STATUS_STYLES, STATUS_LABELS, STATUS_ORDER } from "@/lib/status";

function StatusBadge({ status }: { status: Expense["status"] }) {
  return (
    <span
      className={`text-xs px-2.5 py-1 font-medium ${STATUS_STYLES[status]}`}
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
        isActive ? "opacity-100 text-foreground" : "opacity-0 group-hover:opacity-40 text-muted-foreground"
      }`}
    >
      {isActive && direction === "desc" ? "\u25BC" : "\u25B2"}
    </span>
  );
}

function compareValues(a: Expense, b: Expense, field: SortField, dir: SortDir): number {
  let cmp: number;
  if (field === "amount") {
    cmp = (a.amount ?? 0) - (b.amount ?? 0);
  } else if (field === "status") {
    cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  } else {
    cmp = (a[field] ?? "").localeCompare(b[field] ?? "");
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
      <div className="text-center py-20 text-muted-foreground">
        <p className="font-serif text-2xl mb-3 text-foreground">No expenses found</p>
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
    setSelected(allSelected ? new Set() : new Set(expenses.map((e) => e.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function patchExpenses(
    ids: string[],
    body: Record<string, unknown>,
    onSuccess: (updated: Record<string, unknown>[]) => void
  ) {
    if (ids.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, ...body }),
      });
      if (res.ok) {
        const { updated } = await res.json();
        onSuccess(updated);
        setSelected(new Set());
      }
    } finally {
      setLoading(false);
    }
  }

  const selectedIds = () => Array.from(selected);

  function bulkUpdateStatus(status: "approved" | "reimbursed") {
    patchExpenses(selectedIds(), { status }, (updated) => {
      const map = new Map(updated.map((u) => [u.id as string, u.status as Expense["status"]]));
      setExpenses((prev) =>
        prev.map((e) => (map.has(e.id) ? { ...e, status: map.get(e.id)! } : e))
      );
    });
  }

  function bulkArchive(archive: boolean) {
    const ids = selectedIds();
    patchExpenses(ids, { action: archive ? "archive" : "unarchive" }, () => {
      const idSet = new Set(ids);
      setExpenses((prev) => prev.filter((e) => !idSet.has(e.id)));
    });
  }

  function updateCategory(ids: string[], category: string) {
    if (!ids.length || !category) return;
    patchExpenses(ids, { category }, (updated) => {
      const map = new Map(updated.map((u) => [u.id as string, u.category as string]));
      setExpenses((prev) =>
        prev.map((e) => (map.has(e.id) ? { ...e, category: map.get(e.id)! } : e))
      );
      setEditingCategoryId(null);
    });
  }

  const selectedExpenses = expenses.filter((e) => selected.has(e.id));
  const canApprove = selectedExpenses.some(
    (e) => e.status === "pending" || e.status === "needs_review"
  );
  const canReimburse = selectedExpenses.some((e) => e.status === "approved");

  return (
    <div>
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-6 px-4 py-3 bg-muted border border-border text-foreground">
          <span className="text-sm font-medium">
            {selected.size} selected
          </span>
          {canApprove && (
            <button
              onClick={() => bulkUpdateStatus("approved")}
              disabled={loading}
              className="bg-foreground text-background px-3 py-1 text-sm font-medium hover:bg-foreground/80 disabled:opacity-50 transition-colors"
            >
              {loading ? "Updating..." : "Approve"}
            </button>
          )}
          {canReimburse && (
            <button
              onClick={() => bulkUpdateStatus("reimbursed")}
              disabled={loading}
              className="bg-foreground text-background px-3 py-1 text-sm font-medium hover:bg-foreground/80 disabled:opacity-50 transition-colors"
            >
              {loading ? "Updating..." : "Mark Reimbursed"}
            </button>
          )}
          <select
            value=""
            onChange={(e) => updateCategory(Array.from(selected), e.target.value)}
            disabled={loading}
            className="border border-border bg-background text-foreground px-2 py-1 text-sm disabled:opacity-50"
          >
            <option value="" disabled>
              Change Category...
            </option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="text-foreground bg-background">
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
          <button
            onClick={() => bulkArchive(!archiveMode)}
            disabled={loading}
              className="bg-foreground text-background px-3 py-1 text-sm font-medium hover:bg-foreground/80 disabled:opacity-50 transition-colors"
          >
            {loading ? "Updating..." : archiveMode ? "Unarchive" : "Archive"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-muted-foreground hover:text-foreground ml-auto transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-foreground text-left">
              <th className="pb-3 pr-2 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </th>
              {([
                ["date", "Date"],
                ["sender_name", "Who"],
                ["merchant", "Merchant"],
                ["amount", "Amount"],
                ["category", "Category"],
                ["status", "Status"],
              ] as [SortField, string][]).map(([field, label]) => (
                <th
                  key={field}
                  className={`pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none group ${
                    field === "amount" ? "text-right" : ""
                  }`}
                  onClick={() => handleSort(field)}
                >
                  {label}
                  <SortArrow field={field} activeField={sortField} direction={sortDir} />
                </th>
              ))}
              <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((expense) => (
              <tr
                key={expense.id}
                className={`border-b border-border hover:bg-muted transition-colors ${
                  selected.has(expense.id) ? "bg-muted" : ""
                }`}
              >
                <td className="py-3.5 pr-2">
                  <input
                    type="checkbox"
                    checked={selected.has(expense.id)}
                    onChange={() => toggleOne(expense.id)}
                  />
                </td>
                <td className="py-3.5 pr-4 text-muted-foreground">{formatDate(expense.date)}</td>
                <td className="py-3.5 pr-4">{expense.sender_name ?? "-"}</td>
                <td className="py-3.5 pr-4 font-medium">
                  <Link
                    href={`/expenses/${expense.id}`}
                    className="hover:underline text-foreground"
                  >
                    {expense.merchant ?? "Unknown"}
                  </Link>
                </td>
                <td className="py-3.5 pr-4 text-right tabular-nums font-medium">
                  {formatCurrency(expense.amount)}
                </td>
                <td className="py-3.5 pr-4">
                  {editingCategoryId === expense.id ? (
                    <select
                      autoFocus
                      value={expense.category ?? ""}
                      onChange={(e) => updateCategory([expense.id], e.target.value)}
                      onBlur={() => setEditingCategoryId(null)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingCategoryId(null);
                      }}
                      className="border border-accent px-1 py-0.5 text-sm bg-background w-full"
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
                      className="capitalize cursor-pointer hover:text-muted-foreground hover:underline transition-colors"
                      title="Click to change category"
                    >
                      {expense.category?.replace(/_/g, " ") ?? "-"}
                    </span>
                  )}
                </td>
                <td className="py-3.5 pr-4">
                  <StatusBadge status={expense.status} />
                </td>
                <td className="py-3.5">
                  {expense.receipt_url ? (
                    <Link
                      href={`/expenses/${expense.id}`}
                      className="text-foreground underline hover:text-muted-foreground text-xs font-medium transition-colors"
                    >
                      View
                    </Link>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-foreground">
              <td colSpan={4} className="py-4 pr-4 text-right text-sm font-semibold text-muted-foreground">
                Total
              </td>
              <td className="py-4 pr-4 text-right tabular-nums text-sm font-bold">
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
