-- Create table for storing auth configuration
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Insert auth settings
INSERT INTO app_settings (key, value)
VALUES (
  'auth_config',
  jsonb_build_object(
    'jwt_expiry', '24h',
    'security_email_domains', '*',
    'secure_email_change_enabled', true,
    'autoconfirm', false,
    'email_templates', jsonb_build_object(
      'recovery', jsonb_build_object(
        'subject', 'Reset Your Password',
        'content_html', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #2563eb;">Reset Your Password</h2><p>Click the button below to reset your password:</p><div style="margin: 24px 0;"><a href="{{ .ConfirmationURL }}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a></div><p style="color: #dc2626;">This link will expire in 24 hours.</p></div>'
      )
    )
  )
)
ON CONFLICT (key) DO UPDATE
SET 
  value = EXCLUDED.value,
  updated_at = now();

-- Create function to get auth settings
CREATE OR REPLACE FUNCTION get_auth_settings()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM app_settings WHERE key = 'auth_config'
$$;

-- Grant access to authenticated users
GRANT SELECT ON app_settings TO authenticated;
GRANT EXECUTE ON FUNCTION get_auth_settings TO authenticated;

-- Add helpful comments
COMMENT ON TABLE app_settings IS 'Application settings including auth configuration';
COMMENT ON FUNCTION get_auth_settings IS 'Get current auth settings and email templates';