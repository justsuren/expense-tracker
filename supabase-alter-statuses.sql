-- Run this in Supabase SQL Editor to add approval/reimbursement workflow
-- Adds 'approved' and 'reimbursed' statuses plus timestamp columns

ALTER TYPE expense_status ADD VALUE 'approved';
ALTER TYPE expense_status ADD VALUE 'reimbursed';

ALTER TABLE expenses ADD COLUMN approved_at TIMESTAMPTZ;
ALTER TABLE expenses ADD COLUMN reimbursed_at TIMESTAMPTZ;
