-- Enable pgcrypto extension in the public schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- Drop existing function
DROP FUNCTION IF EXISTS handle_temp_password_recovery;

-- Create updated function with proper schema references
CREATE OR REPLACE FUNCTION handle_temp_password_recovery(p_user_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_temp_password text;
  v_user_id uuid;
BEGIN
  -- Get user ID using auth schema
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email
  AND deleted_at IS NULL;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Generate secure temporary password (8 chars)
  SELECT string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', ceil(random() * 36)::integer, 1), '')
  INTO v_temp_password
  FROM generate_series(1, 8);

  -- Update user password and metadata
  UPDATE auth.users
  SET 
    encrypted_password = public.crypt(v_temp_password, public.gen_salt('bf', 10)),
    raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'has_temp_password', true,
        'temp_password_expires_at', (now() + interval '24 hours')
      ),
    updated_at = now(),
    email_confirmed_at = COALESCE(email_confirmed_at, now()) -- Ensure email is confirmed
  WHERE id = v_user_id;

  RETURN v_temp_password;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to handle password recovery: %', SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_temp_password_recovery TO authenticated;