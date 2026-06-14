-- Add audit columns to auth-related tables
ALTER TABLE IF EXISTS auth.users 
  ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS failed_attempts integer DEFAULT 0;

-- Create index for faster auth queries
CREATE INDEX IF NOT EXISTS idx_users_email 
  ON auth.users (email);

-- Add helpful comment
COMMENT ON TABLE auth.users IS 'Auth users table with additional security tracking columns';