-- Create function to check subscription in Stripe
CREATE OR REPLACE FUNCTION check_stripe_subscription(user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stripe_key text := '__STRIPE_SECRET_KEY__';
  curl_command text;
  response jsonb;
BEGIN
  -- Build the curl command
  curl_command := format(
    'curl -s -G https://api.stripe.com/v1/customers/search ' ||
    '-u %L: ' ||
    '--data-urlencode %L ' ||
    '-d %L',
    stripe_key,
    format('query=email:''%s''', user_email),
    'expand[]=data.subscriptions'
  );

  -- Execute the curl command
  response := (SELECT content::jsonb FROM http_post('https://api.stripe.com/v1/customers/search',
    headers := jsonb_build_object(
      'Authorization', format('Bearer %s', stripe_key)
    ),
    params := jsonb_build_object(
      'query', format('email:''%s''', user_email),
      'expand[]', 'data.subscriptions'
    )
  ));

  RETURN response;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_stripe_subscription TO authenticated;

-- Create function to sync subscription status
CREATE OR REPLACE FUNCTION sync_subscription_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
  stripe_data jsonb;
BEGIN
  -- Get user email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Check Stripe subscription
  stripe_data := check_stripe_subscription(user_email);
  
  -- Update subscription status based on Stripe data
  IF stripe_data->>'data' IS NOT NULL AND jsonb_array_length(stripe_data->'data') > 0 THEN
    NEW.stripe_customer_id := stripe_data->'data'->0->>'id';
    
    IF stripe_data->'data'->0->'subscriptions'->'data' IS NOT NULL 
       AND jsonb_array_length(stripe_data->'data'->0->'subscriptions'->'data') > 0 THEN
      NEW.stripe_subscription_id := stripe_data->'data'->0->'subscriptions'->'data'->0->>'id';
      NEW.status := stripe_data->'data'->0->'subscriptions'->'data'->0->>'status';
      NEW.current_period_end := to_timestamp((stripe_data->'data'->0->'subscriptions'->'data'->0->>'current_period_end')::bigint);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for subscription syncing
DROP TRIGGER IF EXISTS sync_subscription_trigger ON subscriptions;
CREATE TRIGGER sync_subscription_trigger
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_status();