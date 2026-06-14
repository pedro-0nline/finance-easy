-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_stripe_subscription(text);

-- Create function to get subscription by joining user email with stripe_customer
CREATE OR REPLACE FUNCTION get_user_stripe_subscription(p_user_email text)
RETURNS TABLE (
  subscription_id text,
  customer_id text,
  status text,
  current_period_end timestamptz,
  attrs jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH active_subscription AS (
    SELECT 
      s.id,
      c.id as customer_id,
      s.status,
      s.current_period_end,
      s.attrs
    FROM stripe_costumer c
    JOIN stripe_subscription s ON s.customer = c.id
    WHERE c.email = p_user_email
    AND (
      -- Check for active subscription with valid period
      (s.status = 'active' AND s.current_period_end > now()) OR
      -- Check for trialing subscription
      s.status = 'trialing' OR
      -- Check for subscription in attrs
      (s.attrs->>'status' = 'active' AND 
       (s.attrs->>'current_period_end')::timestamptz > now())
    )
    ORDER BY s.current_period_end DESC
    LIMIT 1
  )
  SELECT 
    s.id::text as subscription_id,
    s.customer_id::text,
    CASE 
      WHEN s.status = 'active' AND s.current_period_end > now() THEN 'active'
      WHEN s.status = 'trialing' THEN 'trialing'
      WHEN s.attrs->>'status' = 'active' AND 
           (s.attrs->>'current_period_end')::timestamptz > now() THEN 'active'
      ELSE s.status
    END as status,
    COALESCE(
      s.current_period_end,
      (s.attrs->>'current_period_end')::timestamptz
    ) as current_period_end,
    s.attrs
  FROM active_subscription s;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_stripe_subscription TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_user_stripe_subscription IS 'Get active or trialing Stripe subscription details with comprehensive status checks';