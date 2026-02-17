export interface Expense {
  id: string;
  date: string | null;
  amount: number | null;
  merchant: string | null;
  category: string | null;
  status: "pending" | "needs_review";
  receipt_url: string | null;
  raw_ai_data: Record<string, unknown> | null;
  submitted_at: string;
  sender_email: string | null;
  created_at: string;
}

export interface ParsedReceipt {
  date: string | null;
  merchant: string | null;
  amount: number | null;
  category: string | null;
  confidence: number;
}
