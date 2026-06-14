-- Enable HTTP extension
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA extensions;

-- Create function to parse Stripe timestamps
CREATE OR REPLACE FUNCTION parse_stripe_timestamp(ts bigint)
RETURNS timestamptz
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT to_timestamp(ts)::timestamptz;
$$;

-- Create function to get subscription by customer email
CREATE OR REPLACE FUNCTION get_stripe_subscription_by_email(customer_email text)
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
DECLARE
  stripe_key text := '__STRIPE_SECRET_KEY__';
  response jsonb;
BEGIN
  -- Make HTTP request to Stripe API using basic auth
  SELECT content::jsonb INTO response
  FROM http_get(
    'https://api.stripe.com/v1/customers/search?query=email:''' || customer_email || '''&expand[]=subscriptions',
    ARRAY[
      format('Authorization: Bearer %s', stripe_key),
      'Content-Type: application/x-www-form-urlencoded'
    ]::text[]
  );

  -- Return subscription data if found
  RETURN QUERY
  SELECT 
    (subscription->>'id')::text,
    (customer->>'id')::text,
    (subscription->>'status')::text,
    parse_stripe_timestamp((subscription->>'current_period_end')::bigint)
  FROM jsonb_array_elements(response->'data') customer
  CROSS JOIN jsonb_array_elements(customer->'subscriptions'->'data') subscription
  WHERE customer->>'email' = customer_email
  ORDER BY (subscription->>'current_period_end')::bigint DESC
  LIMIT 1;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION parse_stripe_timestamp TO authenticated;
GRANT EXECUTE ON FUNCTION get_stripe_subscription_by_email TO authenticated;