-- =============================================================================
-- Schema Update: Support for Local Users (Username-only accounts)
-- =============================================================================

-- Add support for local users (without Supabase Auth)
-- These are family members who don't have email addresses

-- Add new columns to family_members table
ALTER TABLE family_members 
ADD COLUMN is_local_user BOOLEAN DEFAULT false,
ADD COLUMN username TEXT,
ADD COLUMN password_hash TEXT,
ADD COLUMN created_by_admin UUID REFERENCES family_members(id);

-- Make user_id nullable since local users won't have Supabase accounts
ALTER TABLE family_members 
ALTER COLUMN user_id DROP NOT NULL;

-- Add constraint: either user_id or username must be set
ALTER TABLE family_members 
ADD CONSTRAINT check_user_identification 
CHECK (
  (user_id IS NOT NULL AND is_local_user = false) OR 
  (username IS NOT NULL AND is_local_user = true)
);

-- Add unique constraint for usernames within families
CREATE UNIQUE INDEX idx_family_username 
ON family_members(family_id, username) 
WHERE is_local_user = true;

-- Create function to hash passwords (simple bcrypt-style hashing)
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- In a real implementation, this would use bcrypt
  -- For now, using a simple hash with salt
  RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql;

-- Create function to verify passwords
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN crypt(password, hash) = hash;
END;
$$ LANGUAGE plpgsql;

-- Create index for faster lookups
CREATE INDEX idx_family_members_username ON family_members(username) WHERE is_local_user = true;
CREATE INDEX idx_family_members_is_local ON family_members(is_local_user);