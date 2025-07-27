-- =============================================================================
-- Migration: Simplify Family Invitation System
-- =============================================================================
-- This migration transforms the complex invitation code system to a simple
-- single permanent family code system.

-- Step 1: Add family_code column to families table
ALTER TABLE families 
ADD COLUMN family_code TEXT UNIQUE DEFAULT '';

-- Step 2: Generate family codes for existing families
-- This will create a 5-character code for each existing family
UPDATE families 
SET family_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 5))
WHERE family_code = '' OR family_code IS NULL;

-- Step 3: Make family_code NOT NULL after populating existing records
ALTER TABLE families 
ALTER COLUMN family_code SET NOT NULL;

-- Step 4: Drop the family_invitation_codes table (no longer needed)
DROP TABLE IF EXISTS family_invitation_codes;

-- Step 5: Update RLS policies - Remove old invitation code policies
-- Only drop policies if the table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'family_invitation_codes') THEN
        DROP POLICY IF EXISTS "Family admins can manage invitation codes" ON family_invitation_codes;
        DROP POLICY IF EXISTS "Anyone can view valid invitation codes" ON family_invitation_codes;
    END IF;
END $$;

-- Step 6: Add new RLS policy for family codes
-- Anyone can view families by family_code (needed for joining families)
CREATE POLICY "Anyone can view families by code" ON families
  FOR SELECT USING (
    family_code != '' AND family_code IS NOT NULL
  );

-- =============================================================================
-- Verification queries (optional - can be removed in production)
-- =============================================================================

-- Verify all families have family codes
-- SELECT COUNT(*) as families_with_codes FROM families WHERE family_code IS NOT NULL AND family_code != '';

-- Verify family codes are unique and 5 characters
-- SELECT family_code, LENGTH(family_code) as code_length FROM families;

-- =============================================================================
-- Rollback instructions (for reference only)
-- =============================================================================

-- To rollback this migration:
-- 1. DROP POLICY "Anyone can view families by code" ON families;
-- 2. ALTER TABLE families DROP COLUMN family_code;
-- 3. Recreate family_invitation_codes table and policies (see old schema.sql)