-- Create table for temporary passwords
CREATE TABLE temp_passwords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  user_email text NOT NULL,
  temp_password text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  UNIQUE(user_id, user_email)
);

-- Enable RLS
ALTER TABLE temp_passwords ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own temp passwords"
  ON temp_passwords FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_temp_passwords_user ON temp_passwords(user_id);
CREATE INDEX idx_temp_passwords_email ON temp_passwords(user_email);
CREATE INDEX idx_temp_passwords_expires ON temp_passwords(expires_at);

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS handle_temp_password_recovery;

-- Create updated function to handle temporary passwords
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

  -- Store temporary password
  INSERT INTO temp_passwords (
    user_id,
    user_email,
    temp_password,
    expires_at
  )
  VALUES (
    user_id,
    user_email,
    temp_password,
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
    encrypted_password = crypt(temp_password, gen_salt('bf')),
    raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'has_temp_password', true,
        'temp_password_expires_at', (now() + interval '24 hours')
      ),
    updated_at = now()
  WHERE id = user_id;

  RETURN temp_password;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_temp_password_recovery TO authenticated;

-- Add helpful comments
COMMENT ON TABLE temp_passwords IS 'Stores temporary passwords for user recovery';
COMMENT ON FUNCTION handle_temp_password_recovery IS 'Generates and stores temporary password for user recovery';