-- Create function to get subscriptions by email
CREATE OR REPLACE FUNCTION get_subscriptions_by_email(user_email text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  current_period_end timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT s.*
  FROM subscriptions s
  JOIN auth.users u ON s.user_id = u.id
  WHERE u.email = user_email
  ORDER BY s.current_period_end DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_subscriptions_by_email TO authenticated;