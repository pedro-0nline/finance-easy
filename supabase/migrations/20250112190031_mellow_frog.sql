/*
  # Add subscription verification functionality

  1. New Functions
    - verify_subscription: Verifies subscription status in Stripe
    - sync_subscription: Syncs subscription data from Stripe
  
  2. Changes
    - Add verification functions and triggers
    - Add proper error handling
*/

-- Function to verify subscription status
CREATE OR REPLACE FUNCTION verify_subscription(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
  v_stripe_key text := '__STRIPE_SECRET_KEY__';
  v_response jsonb;
  v_subscription jsonb;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  IF v_user_email IS NULL THEN
    RETURN false;
  END IF;

  -- Query Stripe API
  SELECT content::jsonb INTO v_response 
  FROM http_post(
    'https://api.stripe.com/v1/customers/search',
    headers := jsonb_build_object(
      'Authorization', format('Bearer %s', v_stripe_key),
      'Content-Type', 'application/x-www-form-urlencoded'
    ),
    params := jsonb_build_object(
      'query', format('email:''%s''', v_user_email),
      'expand[]', 'data.subscriptions'
    )
  );

  -- Check if customer exists and has active subscription
  IF v_response->>'data' IS NOT NULL AND jsonb_array_length(v_response->'data') > 0 THEN
    -- Get first subscription
    v_subscription := v_response->'data'->0->'subscriptions'->'data'->0;
    
    IF v_subscription IS NOT NULL THEN
      -- Check subscription status
      RETURN (
        v_subscription->>'status' = 'active' OR 
        v_subscription->>'status' = 'trialing'
      );
    END IF;
  END IF;

  RETURN false;
END;
$$;

-- Function to sync subscription data
CREATE OR REPLACE FUNCTION sync_subscription_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email text;
  v_stripe_key text := '__STRIPE_SECRET_KEY__';
  v_response jsonb;
  v_subscription jsonb;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Query Stripe API
  SELECT content::jsonb INTO v_response 
  FROM http_post(
    'https://api.stripe.com/v1/customers/search',
    headers := jsonb_build_object(
      'Authorization', format('Bearer %s', v_stripe_key),
      'Content-Type', 'application/x-www-form-urlencoded'
    ),
    params := jsonb_build_object(
      'query', format('email:''%s''', v_user_email),
      'expand[]', 'data.subscriptions'
    )
  );

  -- Update subscription data if customer exists
  IF v_response->>'data' IS NOT NULL AND jsonb_array_length(v_response->'data') > 0 THEN
    v_subscription := v_response->'data'->0->'subscriptions'->'data'->0;
    
    IF v_subscription IS NOT NULL THEN
      NEW.stripe_customer_id := v_response->'data'->0->>'id';
      NEW.stripe_subscription_id := v_subscription->>'id';
      NEW.status := v_subscription->>'status';
      NEW.current_period_end := to_timestamp((v_subscription->>'current_period_end')::bigint);
    ELSE
      NEW.status := 'incomplete';
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
  EXECUTE FUNCTION sync_subscription_data();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_subscription TO authenticated;