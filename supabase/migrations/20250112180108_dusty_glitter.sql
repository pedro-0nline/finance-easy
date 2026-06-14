/*
  # Add Subscription Blocking System

  1. New Functions
    - check_active_subscription: Checks if a user has an active subscription
    - block_canceled_subscriptions: Blocks access for users with canceled subscriptions

  2. Security
    - Functions are security definer to bypass RLS
    - Strict access control based on subscription status
*/

-- Function to check if a subscription is active
CREATE OR REPLACE FUNCTION check_active_subscription(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE subscriptions.user_id = user_id
    AND status IN ('active', 'trialing')
    AND (current_period_end > now() OR status = 'trialing')
  );
END;
$$;

-- Function to block canceled subscriptions
CREATE OR REPLACE FUNCTION block_canceled_subscriptions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'canceled' THEN
    -- Update user metadata to indicate blocked status
    UPDATE auth.users
    SET raw_app_meta_data = 
      raw_app_meta_data || 
      jsonb_build_object('subscription_blocked', true)
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for subscription blocking
DROP TRIGGER IF EXISTS block_canceled_subscriptions_trigger ON subscriptions;
CREATE TRIGGER block_canceled_subscriptions_trigger
  AFTER UPDATE OF status ON subscriptions
  FOR EACH ROW
  WHEN (NEW.status = 'canceled')
  EXECUTE FUNCTION block_canceled_subscriptions();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_active_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION block_canceled_subscriptions TO authenticated;