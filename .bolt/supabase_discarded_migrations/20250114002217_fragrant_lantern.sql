-- Update auth configuration for password reset expiration
CREATE OR REPLACE FUNCTION auth.set_config(config jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, pg_catalog, public
AS $$
BEGIN
  UPDATE auth.config
  SET config = $1;
END;
$$;

-- Set new configuration with extended password reset expiration
SELECT auth.set_config(
  jsonb_build_object(
    'mailer_autoconfirm', false,
    'mailer_secure_email_change_enabled', true,
    'jwt_exp', 3600,
    'security_refresh_token_reuse_interval', 10,
    'security_recovery_link_lifetime', 86400 -- 24 hours in seconds
  )
);

-- Drop the function after use
DROP FUNCTION auth.set_config(jsonb);

-- Add helpful comment
COMMENT ON SCHEMA auth IS 'Auth schema with updated password reset link expiration (24 hours)';