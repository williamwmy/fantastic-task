-- =============================================================================
-- Database Migration: Add recurring_type and flexible_interval columns to tasks
-- =============================================================================
-- Run this script to add the missing columns to existing databases

-- Add the new columns to the tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS recurring_type TEXT DEFAULT 'daily',
ADD COLUMN IF NOT EXISTS flexible_interval INTEGER;

-- Add comments for clarity
COMMENT ON COLUMN tasks.recurring_type IS 'Type of recurring: daily, weekly_flexible, monthly_flexible';
COMMENT ON COLUMN tasks.flexible_interval IS 'Number of days for flexible recurring (for flexible tasks)';