"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function DateFilter({
  currentStart,
  currentEnd,
  currentStatus,
  currentWho,
  senderNames,
}: {
  currentStart?: string;
  currentEnd?: string;
  currentStatus?: string;
  currentWho?: string;
  senderNames: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/expenses?${params.toString()}`);
    },
    [router, searchParams]
  );

  function reset() {
    router.push("/expenses");
  }

  const hasFilters = currentStart || currentEnd || currentStatus || currentWho;

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
