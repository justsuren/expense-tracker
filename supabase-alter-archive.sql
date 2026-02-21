-- Run this in Supabase SQL Editor to add archive support
-- Adds archived boolean flag and archived_at timestamp

ALTER TABLE expenses ADD COLUMN archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE expenses ADD COLUMN archived_at TIMESTAMPTZ;

-- Partial index for efficiently filtering non-archived expenses (the default query)
CREATE INDEX idx_expenses_archived ON expenses (archived) WHERE archived = false;
