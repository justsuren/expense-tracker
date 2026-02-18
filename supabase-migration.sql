-- Expense Tracker MVP - Database Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for expense status
CREATE TYPE expense_status AS ENUM ('pending', 'needs_review');

-- Create expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE,
  amount DECIMAL(10, 2),
  merchant VARCHAR(255),
  category VARCHAR(100),
  status expense_status NOT NULL DEFAULT 'needs_review',
  receipt_url TEXT,
  raw_ai_data JSONB,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sender_name VARCHAR(255),
  telegram_chat_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for date-range filtering (primary query pattern)
CREATE INDEX idx_expenses_date ON expenses (date DESC);

-- Index for listing by submission time
CREATE INDEX idx_expenses_submitted_at ON expenses (submitted_at DESC);

-- Row Level Security: permissive policy for MVP (no auth)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for MVP" ON expenses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Storage bucket setup:
-- 1. Create a bucket named "receipts" (set to public)
-- 2. Add these storage policies via SQL or Dashboard:

-- Allow service role to upload receipts
-- CREATE POLICY "Service role can upload receipts"
-- ON storage.objects FOR INSERT
-- TO service_role
-- WITH CHECK (bucket_id = 'receipts');

-- Allow public read access to receipts
-- CREATE POLICY "Public can view receipts"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'receipts');
