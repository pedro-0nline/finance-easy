-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS verify_subscription CASCADE;
DROP FUNCTION IF EXISTS update_subscription_status CASCADE;

-- Create subscription verification function
CREATE OR REPLACE FUNCTION verify_subscription(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_status text;
  v_period_end timestamptz;
BEGIN
  -- Get subscription status and period end
  SELECT status, current_period_end 
  INTO v_subscription_status, v_period_end
  FROM subscriptions 
  WHERE user_id = p_user_id;

  -- Return true if subscription is active or in trial period
  RETURN (
    v_subscription_status IN ('active', 'trialing') AND
    (
      v_subscription_status = 'trialing' OR
      (v_period_end IS NOT NULL AND v_period_end > now())
    )
  );
END;
$$;

-- Create function to update subscription status
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
GRANT EXECUTE ON FUNCTION update_subscription_status TO authenticated;