-- Create function to send password recovery email
CREATE OR REPLACE FUNCTION send_password_recovery_email(p_user_email text, p_temp_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Send email using auth.send_email
  PERFORM auth.send_email(
    p_user_email,
    'Your Temporary Password',
    format(
      'Your temporary password is: %s

Please use this password to log in. For security reasons, we recommend changing your password immediately after logging in.

This temporary password will expire in 24 hours.

Best regards,
The Support Team',
      p_temp_password
    )
  );
END;
$$;

-- Update password recovery function to send email
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

  -- Send email with temporary password
  PERFORM send_password_recovery_email(p_user_email, v_temp_password);

  RETURN v_temp_password;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to handle password recovery: %', SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION send_password_recovery_email TO authenticated;
GRANT EXECUTE ON FUNCTION handle_temp_password_recovery TO authenticated;