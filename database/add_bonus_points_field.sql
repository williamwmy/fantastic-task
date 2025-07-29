-- Add bonus_points field to points_transactions table
-- This migration adds a separate field to track bonus points for cleaner data management

ALTER TABLE points_transactions 
ADD COLUMN bonus_points INTEGER DEFAULT 0;

-- Add comment to document the field
COMMENT ON COLUMN points_transactions.bonus_points IS 'Bonus points earned for tasks taking longer than estimated time. 1 point per 5 minutes overtime.';

-- Update existing bonus transactions to populate the new field
-- Extract bonus points from descriptions like "Task completion (10 + 3 bonus)"
UPDATE points_transactions 
SET bonus_points = CASE 
    WHEN description ~ '\((\d+) \+ (\d+) bonus\)' THEN 
        CAST((regexp_match(description, '\((\d+) \+ (\d+) bonus\)'))[2] AS INTEGER)
    ELSE 0
END
WHERE description LIKE '%bonus%';

-- For clarity, update the main schema documentation
-- The bonus_points field should be included in the main schema.sql for new installations