-- Create support function for auth configuration
CREATE OR REPLACE FUNCTION handle_auth_configuration()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set configuration through environment variables
  -- These will be picked up by the auth service
  SET app.extra.auth.recovery_link_expiry = '86400';  -- 24 hours in seconds
  SET app.extra.auth.email_confirm_required = 'false';
  SET app.extra.auth.secure_email_change = 'true';
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION handle_auth_configuration IS 'Sets auth configuration through environment variables';