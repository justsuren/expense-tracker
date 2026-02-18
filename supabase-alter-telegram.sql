-- Run this in Supabase SQL Editor to update the existing expenses table
-- This replaces sender_email with sender_name and adds telegram_chat_id

ALTER TABLE expenses RENAME COLUMN sender_email TO sender_name;
ALTER TABLE expenses ADD COLUMN telegram_chat_id BIGINT;
