"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function DateFilter({
  currentStart,
  currentEnd,
}: {
  currentStart?: string;
  currentEnd?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [start, setStart] = useState(currentStart ?? "");
  const [end, setEnd] = useState(currentEnd ?? "");

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    if (start) params.set("start", start);
    else params.delete("start");
    if (end) params.set("end", end);
    else params.delete("end");
    router.push(`/expenses?${params.toString()}`);
  }

  function clear() {
    setStart("");
    setEnd("");
    router.push("/expenses");
  }

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
          value={start}
          onChange={(e) => setStart(e.target.value)}
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
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
        />
      </div>
      <button
        onClick={apply}
        className="bg-black text-white px-4 py-1.5 rounded text-sm hover:bg-gray-800"
      >
        Apply
      </button>
      {(currentStart || currentEnd) && (
        <button
          onClick={clear}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}
