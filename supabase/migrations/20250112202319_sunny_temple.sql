-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_stripe_subscription_by_email;

-- Create function to get subscription by customer email with proper HTTP request
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
  -- Make HTTP request to Stripe API using the correct method
  SELECT content::jsonb INTO response
  FROM extensions.http((
    'POST',
    'https://api.stripe.com/v1/customers/search',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer ' || stripe_key)
    ]::extensions.http_header[],
    'application/x-www-form-urlencoded',
    'query=email:''' || customer_email || '''&expand[]=subscriptions'
  )::extensions.http_request);

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
GRANT EXECUTE ON FUNCTION get_stripe_subscription_by_email TO authenticated;