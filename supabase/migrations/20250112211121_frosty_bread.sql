-- Create function to get subscription by joining user email with stripe_customer
CREATE OR REPLACE FUNCTION get_user_stripe_subscription(p_user_email text)
RETURNS TABLE (
  subscription_id text,
  customer_id text,
  status text,
  current_period_end timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id::text as subscription_id,
    c.id::text as customer_id,
    s.status,
    s.current_period_end
  FROM stripe_costumer c
  JOIN extensions.stripe_subscription s ON s.customer = c.id
  WHERE c.email = p_user_email
  ORDER BY s.current_period_end DESC
  LIMIT 1;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_stripe_subscription TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_user_stripe_subscription IS 'Get Stripe subscription details by joining user email with stripe_customer';