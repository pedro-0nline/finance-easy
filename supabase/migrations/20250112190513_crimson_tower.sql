-- Drop existing functions
DROP FUNCTION IF EXISTS verify_subscription CASCADE;
DROP FUNCTION IF EXISTS update_subscription_status CASCADE;

-- Create simplified subscription verification function
CREATE OR REPLACE FUNCTION verify_subscription(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Simple check against the subscriptions table
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

-- Create simplified status update function
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
CREATE TRIGGER subscription_update_trigger
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_status();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_subscription TO authenticated;