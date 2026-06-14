-- Enable pgcrypto extension in the correct schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS handle_temp_password_recovery;

-- Create updated function to handle temporary passwords
CREATE OR REPLACE FUNCTION handle_temp_password_recovery(p_user_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_temp_password text;
  v_user_id uuid;
BEGIN
  -- Generate secure temporary password (8 chars)
  SELECT string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', ceil(random() * 36)::integer, 1), '')
  INTO v_temp_password
  FROM generate_series(1, 8);
  
  -- Get user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Store temporary password
  INSERT INTO temp_passwords (
    user_id,
    user_email,
    temp_password,
    expires_at
  )
  VALUES (
    v_user_id,
    p_user_email,
    v_temp_password,
    now() + interval '24 hours'
  )
  ON CONFLICT (user_id, user_email)
  DO UPDATE SET
    temp_password = EXCLUDED.temp_password,
    expires_at = EXCLUDED.expires_at,
    used = false,
    created_at = now();

  -- Update user password and metadata
  UPDATE auth.users
  SET 
    encrypted_password = extensions.crypt(v_temp_password, extensions.gen_salt('bf')),
    raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'has_temp_password', true,
        'temp_password_expires_at', (now() + interval '24 hours')
      ),
    updated_at = now()
  WHERE id = v_user_id;

  RETURN v_temp_password;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_temp_password_recovery TO authenticated;