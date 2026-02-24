import type { Expense } from "@/lib/types";

export const STATUS_STYLES: Record<Expense["status"], string> = {
  pending: "bg-muted text-foreground border border-border",
  needs_review: "bg-red-50 text-red-800 border border-red-200",
  approved: "bg-green-50 text-green-800 border border-green-200",
  reimbursed: "bg-accent text-accent-foreground",
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
