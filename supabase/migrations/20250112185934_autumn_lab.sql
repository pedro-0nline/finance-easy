/*
  # Add Stripe subscription sync functionality

  1. New Functions
    - sync_stripe_subscription: Syncs subscription data from Stripe
    - update_subscription_status: Updates subscription status in database
  
  2. Changes
    - Add stripe_subscription_id and stripe_customer_id columns to subscriptions table
    - Add indexes for faster lookups
    - Add trigger to automatically sync with Stripe on subscription changes
*/

-- Add new columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN stripe_subscription_id text;
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN stripe_customer_id text;
  END IF;
END $$;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);

-- Function to sync subscription with Stripe
CREATE OR REPLACE FUNCTION sync_stripe_subscription(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
  v_stripe_key text := '__STRIPE_SECRET_KEY__';
  v_response jsonb;
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

  -- Update subscription data
  IF v_response->>'data' IS NOT NULL AND jsonb_array_length(v_response->'data') > 0 THEN
    UPDATE subscriptions
    SET 
      stripe_customer_id = v_response->'data'->0->>'id',
      stripe_subscription_id = CASE 
        WHEN jsonb_array_length(v_response->'data'->0->'subscriptions'->'data') > 0 
        THEN v_response->'data'->0->'subscriptions'->'data'->0->>'id'
        ELSE NULL
      END,
      status = CASE 
        WHEN jsonb_array_length(v_response->'data'->0->'subscriptions'->'data') > 0 
        THEN v_response->'data'->0->'subscriptions'->'data'->0->>'status'
        ELSE 'incomplete'
      END,
      current_period_end = CASE 
        WHEN jsonb_array_length(v_response->'data'->0->'subscriptions'->'data') > 0 
        THEN to_timestamp((v_response->'data'->0->'subscriptions'->'data'->0->>'current_period_end')::bigint)
        ELSE NULL
      END,
      updated_at = now()
    WHERE user_id = p_user_id;

    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Function to update subscription status
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sync with Stripe on insert or update
  PERFORM sync_stripe_subscription(NEW.user_id);
  RETURN NEW;
END;
$$;

-- Create trigger for subscription updates
DROP TRIGGER IF EXISTS subscription_status_trigger ON subscriptions;
CREATE TRIGGER subscription_status_trigger
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_status();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION sync_stripe_subscription TO authenticated;