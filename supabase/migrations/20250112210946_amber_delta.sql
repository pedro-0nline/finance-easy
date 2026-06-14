-- Create a local cache table for stripe customers
CREATE TABLE IF NOT EXISTS stripe_customer_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_id text UNIQUE NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on email for fast lookups
CREATE INDEX idx_stripe_customer_cache_email 
ON stripe_customer_cache (email);

-- Enable RLS
ALTER TABLE stripe_customer_cache ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own customer data"
ON stripe_customer_cache FOR SELECT
TO authenticated
USING (email IN (
  SELECT email FROM auth.users WHERE id = auth.uid()
));

-- Function to sync customer data
CREATE OR REPLACE FUNCTION sync_stripe_customer(
  p_email text,
  p_stripe_id text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid;
BEGIN
  INSERT INTO stripe_customer_cache (
    stripe_id,
    email,
    updated_at
  ) VALUES (
    p_stripe_id,
    p_email,
    now()
  )
  ON CONFLICT (stripe_id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now()
  RETURNING id INTO v_customer_id;

  RETURN v_customer_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION sync_stripe_customer TO authenticated;

-- Add helpful comment
COMMENT ON TABLE stripe_customer_cache IS 'Local cache of Stripe customer data for faster lookups';