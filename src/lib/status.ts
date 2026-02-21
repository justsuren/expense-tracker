import type { Expense } from "@/lib/types";

export const STATUS_STYLES: Record<Expense["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  needs_review: "bg-red-100 text-red-800",
  approved: "bg-green-100 text-green-800",
  reimbursed: "bg-blue-100 text-blue-800",
};

export const STATUS_LABELS: Record<Expense["status"], string> = {
  pending: "Pending",
  needs_review: "Needs Review",
  approved: "Approved",
  reimbursed: "Reimbursed",
};

export const STATUS_ORDER: Record<Expense["status"], number> = {
  pending: 0,
  needs_review: 1,
  approved: 2,
  reimbursed: 3,
};
