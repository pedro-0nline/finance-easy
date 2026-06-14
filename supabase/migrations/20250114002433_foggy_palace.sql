-- Add audit logging table for auth events
CREATE TABLE IF NOT EXISTS auth.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  event_type text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster audit queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user 
  ON auth.audit_log (user_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_created 
  ON auth.audit_log (created_at);

-- Add helpful comments
COMMENT ON TABLE auth.audit_log IS 'Audit log for authentication events';
COMMENT ON COLUMN auth.audit_log.event_type IS 'Type of auth event (login, password_reset, etc)';
COMMENT ON COLUMN auth.audit_log.ip_address IS 'IP address of the request';
COMMENT ON COLUMN auth.audit_log.user_agent IS 'User agent of the request';

-- Add RLS policies
ALTER TABLE auth.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
  ON auth.audit_log
  FOR SELECT
  USING (auth.uid() = user_id);