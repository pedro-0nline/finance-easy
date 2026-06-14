/*
  # Fix subscription verification

  1. Changes
    - Drop trigger before dropping function to handle dependencies
    - Add CASCADE option for safety
    - Recreate verification functionality with proper error handling
*/

-- First drop the trigger that depends on the function
DROP TRIGGER IF EXISTS sync_subscription_trigger ON subscriptions;

-- Now we can safely drop the functions
DROP FUNCTION IF EXISTS sync_subscription_data CASCADE;
DROP FUNCTION IF EXISTS verify_subscription CASCADE;

-- Create simplified subscription verification function
CREATE OR REPLACE FUNCTION verify_subscription(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
    AND (
      status = 'trialing' OR
      (current_period_end IS NOT NULL AND current_period_end > now())
    )
  );
END;
$$;

-- Create function to update subscription status
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set updated_at timestamp
  NEW.updated_at := now();
  
  -- Handle subscription status changes
  IF NEW.status = 'canceled' AND OLD.status != 'canceled' THEN
    -- Update user metadata when subscription is canceled
    UPDATE auth.users
    SET raw_app_meta_data = 
      raw_app_meta_data || 
      jsonb_build_object('subscription_blocked', true)
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for subscription updates
DROP TRIGGER IF EXISTS subscription_update_trigger ON subscriptions;
CREATE TRIGGER subscription_update_trigger
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_status();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_subscription TO authenticated;