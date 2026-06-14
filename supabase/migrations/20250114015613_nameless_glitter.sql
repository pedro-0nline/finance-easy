-- Create function to generate temporary password and send email
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

  -- Update user metadata
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'has_temp_password', true,
      'temp_password', temp_password,
      'temp_password_expires_at', (now() + interval '24 hours')
    )
  WHERE id = user_id;

  -- Send email using auth.send_email
  PERFORM auth.send_email(
    user_email,
    'Temporary Login Password',
    format(
      'Your temporary password is: %s\n\nPlease log in with this password and change it immediately.\nThis password will expire in 24 hours.',
      temp_password
    )
  );

  RETURN temp_password;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_temp_password_recovery TO authenticated;