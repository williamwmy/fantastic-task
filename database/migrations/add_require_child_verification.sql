-- Add require_child_verification setting to families table
-- This controls whether children's task completions need administrator approval

ALTER TABLE families 
ADD COLUMN require_child_verification BOOLEAN DEFAULT true;

-- Add comment explaining the column
COMMENT ON COLUMN families.require_child_verification IS 
'Controls whether children task completions require admin verification before points are awarded. Defaults to true.';