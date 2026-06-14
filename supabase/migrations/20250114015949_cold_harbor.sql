-- Create function to store auth configuration
CREATE OR REPLACE FUNCTION configure_auth_settings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Store auth configuration in storage
  INSERT INTO storage.objects (
    bucket_id,
    name,
    owner,
    created_at,
    updated_at,
    metadata
  ) VALUES (
    'auth-config',
    'settings/auth.json',
    auth.uid(),
    now(),
    now(),
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
  ON CONFLICT (bucket_id, name) DO UPDATE
  SET 
    metadata = EXCLUDED.metadata,
    updated_at = now();
END;
$$;

-- Create auth-config bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('auth-config', 'Auth Configuration')
ON CONFLICT DO NOTHING;

-- Execute the configuration function
SELECT configure_auth_settings();

-- Drop the function since it's only needed once
DROP FUNCTION configure_auth_settings();

-- Add helpful comment
COMMENT ON TABLE storage.objects IS 'Table storing auth configuration and email templates';