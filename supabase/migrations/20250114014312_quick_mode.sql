-- Add temporary password fields to auth.users
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS has_temp_password boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS temp_password_hash text;

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
  temp_password := encode(gen_random_bytes(6), 'base64');
  
  -- Get user ID
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Update user record
  UPDATE auth.users
  SET 
    has_temp_password = true,
    temp_password_hash = crypt(temp_password, gen_salt('bf'))
  WHERE id = user_id;

  RETURN temp_password;
END;
$$;