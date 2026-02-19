"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

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
  const [start, setStart] = useState(currentStart ?? "");
  const [end, setEnd] = useState(currentEnd ?? "");
  const [status, setStatus] = useState(currentStatus ?? "");
  const [who, setWho] = useState(currentWho ?? "");

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    if (start) params.set("start", start);
    else params.delete("start");
    if (end) params.set("end", end);
    else params.delete("end");
    if (status) params.set("status", status);
    else params.delete("status");
    if (who) params.set("who", who);
    else params.delete("who");
    router.push(`/expenses?${params.toString()}`);
  }

  function clear() {
    setStart("");
    setEnd("");
    setStatus("");
    setWho("");
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
      <div>
        <label htmlFor="status" className="block text-sm text-gray-600 mb-1">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
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
          value={who}
          onChange={(e) => setWho(e.target.value)}
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
      <button
        onClick={apply}
        className="bg-black text-white px-4 py-1.5 rounded text-sm hover:bg-gray-800"
      >
        Apply
      </button>
      {hasFilters && (
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
