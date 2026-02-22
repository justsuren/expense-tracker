"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/categories";

export function DateFilter({
  currentStart,
  currentEnd,
  currentStatus,
  currentWho,
  currentCategories,
  currentArchived,
  senderNames,
}: {
  currentStart?: string;
  currentEnd?: string;
  currentStatus?: string;
  currentWho?: string;
  currentCategories?: string;
  currentArchived?: string;
  senderNames: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  const selectedCategories = currentCategories ? currentCategories.split(",").filter(Boolean) : [];

  const navigate = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/expenses?${params.toString()}`);
    },
    [router, searchParams]
  );

  function toggleCategory(cat: string) {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    navigate("categories", next.join(","));
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function reset() {
    router.push("/expenses");
  }

  const hasFilters = currentStart || currentEnd || currentStatus || currentWho || currentCategories || currentArchived;

  return (
    <div className="flex flex-wrap items-end gap-3 mb-6">
      <div>
        <label
          htmlFor="start-date"
          className="block text-sm text-gray-600 mb-1"
        >
          From
        </label>
        <input
          id="start-date"
          type="date"
          defaultValue={currentStart ?? ""}
          onChange={(e) => navigate("start", e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
        />
      </div>
      <div>
        <label htmlFor="end-date" className="block text-sm text-gray-600 mb-1">
          To
        </label>
        <input
          id="end-date"
          type="date"
          defaultValue={currentEnd ?? ""}
          onChange={(e) => navigate("end", e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
        />
      </div>
      <div>
        <label htmlFor="status" className="block text-sm text-gray-600 mb-1">
          Status
        </label>
        <select
          id="status"
          defaultValue={currentStatus ?? ""}
          onChange={(e) => navigate("status", e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="needs_review">Needs Review</option>
          <option value="approved">Approved</option>
          <option value="reimbursed">Reimbursed</option>
        </select>
      </div>
      <div>
        <label htmlFor="who" className="block text-sm text-gray-600 mb-1">
          Who
        </label>
        <select
          id="who"
          defaultValue={currentWho ?? ""}
          onChange={(e) => navigate("who", e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All</option>
          {senderNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div className="relative" ref={catRef}>
        <label className="block text-sm text-gray-600 mb-1">Category</label>
        <button
          type="button"
          onClick={() => setCatOpen((o) => !o)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white text-left min-w-[140px] flex items-center justify-between gap-2"
        >
          <span className="truncate">
            {selectedCategories.length === 0
              ? "All"
              : selectedCategories.length === 1
                ? CATEGORY_LABELS[selectedCategories[0] as keyof typeof CATEGORY_LABELS] ?? selectedCategories[0]
                : `${selectedCategories.length} selected`}
          </span>
          <svg className="w-3 h-3 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {catOpen && (
          <div className="absolute z-20 mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-64 overflow-y-auto w-56">
            {CATEGORIES.map((cat) => (
              <label
                key={cat}
                className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="rounded"
                />
                {CATEGORY_LABELS[cat]}
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          id="archived"
          type="checkbox"
          checked={currentArchived === "true"}
          onChange={(e) => navigate("archived", e.target.checked ? "true" : "")}
          className="rounded"
        />
        <label htmlFor="archived" className="text-sm text-gray-600">
          Show Archived
        </label>
      </div>
      {hasFilters && (
        <button
          onClick={reset}
          className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded text-sm hover:bg-gray-300"
        >
          Reset
        </button>
      )}
    </div>
  );
}
