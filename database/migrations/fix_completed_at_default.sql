-- Fix completed_at column to not have DEFAULT NOW()
-- This allows us to set custom completion dates when completing tasks on different dates

-- Remove the default value from the completed_at column
ALTER TABLE task_completions 
ALTER COLUMN completed_at DROP DEFAULT;

-- The column should remain NOT NULL but without a default value
-- This forces applications to explicitly provide a completion timestamp