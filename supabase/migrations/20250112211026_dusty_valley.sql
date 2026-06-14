-- Drop existing index if it exists
DROP INDEX IF EXISTS idx_stripe_customer_cache_email;

-- Create index on email for fast lookups
CREATE INDEX idx_stripe_customer_cache_email 
ON stripe_customer_cache (email);

-- Add helpful comment
COMMENT ON INDEX idx_stripe_customer_cache_email IS 'Index for optimizing stripe customer lookups by email';

-- Create function to lookup customer by email
CREATE OR REPLACE FUNCTION lookup_stripe_customer_by_email(p_email text)
RETURNS TABLE (
  id uuid,
  stripe_id text,
  email text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM stripe_customer_cache
  WHERE email = p_email
  ORDER BY updated_at DESC
  LIMIT 1;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION lookup_stripe_customer_by_email TO authenticated;