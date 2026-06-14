-- Add temporary password fields to auth.users
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS has_temp_password boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS temp_password_hash text;

-- Create extension for cryptographic functions if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function to generate and set temporary password
CREATE OR REPLACE FUNCTION handle_temp_password_recovery(user_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  temp_password text;
  user_id uuid;
BEGIN
  -- Generate secure temporary password (8 chars)
  SELECT string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', ceil(random() * 36)::integer, 1), '')
  INTO temp_password
  FROM generate_series(1, 8);
  
  -- Get user ID
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Update user record with metadata
  UPDATE auth.users
  SET 
    raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'has_temp_password', true,
        'temp_password_expires_at', (now() + interval '24 hours')
      ),
    encrypted_password = crypt(temp_password, gen_salt('bf'))
  WHERE id = user_id;

  RETURN temp_password;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_temp_password_recovery TO authenticated;