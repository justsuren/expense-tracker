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

  const inputClasses =
    "border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:ring-0 focus:outline-none";
  const labelClasses = "block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5";

  return (
    <div className="border-b border-border pb-6 mb-8">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="start-date" className={labelClasses}>
            From
          </label>
          <input
            id="start-date"
            type="date"
            defaultValue={currentStart ?? ""}
            onChange={(e) => navigate("start", e.target.value)}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="end-date" className={labelClasses}>
            To
          </label>
          <input
            id="end-date"
            type="date"
            defaultValue={currentEnd ?? ""}
            onChange={(e) => navigate("end", e.target.value)}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="status" className={labelClasses}>
            Status
          </label>
          <select
            id="status"
            defaultValue={currentStatus ?? ""}
            onChange={(e) => navigate("status", e.target.value)}
            className={`${inputClasses} bg-background`}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="needs_review">Needs Review</option>
            <option value="approved">Approved</option>
            <option value="reimbursed">Reimbursed</option>
          </select>
        </div>
        <div>
          <label htmlFor="who" className={labelClasses}>
            Who
          </label>
          <select
            id="who"
            defaultValue={currentWho ?? ""}
            onChange={(e) => navigate("who", e.target.value)}
            className={`${inputClasses} bg-background`}
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
          <label className={labelClasses}>Category</label>
          <button
            type="button"
            onClick={() => setCatOpen((o) => !o)}
            className={`${inputClasses} text-left min-w-[160px] flex items-center justify-between gap-2`}
          >
            <span className="truncate">
              {selectedCategories.length === 0
                ? "All"
                : selectedCategories.length === 1
                  ? CATEGORY_LABELS[selectedCategories[0] as keyof typeof CATEGORY_LABELS] ?? selectedCategories[0]
                  : `${selectedCategories.length} selected`}
            </span>
            <svg className="w-3 h-3 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {catOpen && (
            <div className="absolute z-20 mt-1 bg-background border border-border shadow-sm max-h-64 overflow-y-auto w-56">
              {CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                  />
                  {CATEGORY_LABELS[cat]}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 pb-0.5">
          <input
            id="archived"
            type="checkbox"
            checked={currentArchived === "true"}
            onChange={(e) => navigate("archived", e.target.checked ? "true" : "")}
          />
          <label htmlFor="archived" className="text-sm text-muted-foreground">
            Show Archived
          </label>
        </div>
        {hasFilters && (
          <button
            onClick={reset}
            className="border border-accent text-accent px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
