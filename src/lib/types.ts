export interface Expense {
  id: string;
  date: string | null;
  amount: number | null;
  merchant: string | null;
  category: string | null;
  status: "pending" | "needs_review" | "approved" | "reimbursed";
  receipt_url: string | null;
  raw_ai_data: Record<string, unknown> | null;
  submitted_at: string;
  sender_name: string | null;
  telegram_chat_id: number | null;
  approved_at: string | null;
  reimbursed_at: string | null;
  created_at: string;
}

export interface ParsedReceipt {
  date: string | null;
  merchant: string | null;
  amount: number | null;
  category: string | null;
  confidence: number;
}
