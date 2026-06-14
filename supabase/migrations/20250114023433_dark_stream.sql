-- Drop existing subscription-related functions
DROP FUNCTION IF EXISTS verify_subscription CASCADE;
DROP FUNCTION IF EXISTS check_subscription_status CASCADE;

-- Create function to check subscription status
CREATE OR REPLACE FUNCTION check_subscription_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription record;
  v_result jsonb;
BEGIN
  -- Get subscription data
  SELECT 
    s.status,
    s.current_period_end,
    s.stripe_customer_id,
    s.stripe_subscription_id
  INTO v_subscription
  FROM subscriptions s
  WHERE s.user_id = p_user_id;

  -- Build result object
  v_result := jsonb_build_object(
    'status', COALESCE(v_subscription.status, 'inactive'),
    'current_period_end', v_subscription.current_period_end,
    'customer_id', v_subscription.stripe_customer_id,
    'subscription_id', v_subscription.stripe_subscription_id
  );

  -- If no subscription found, return inactive status
  IF v_subscription IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'inactive',
      'current_period_end', NULL,
      'customer_id', NULL,
      'subscription_id', NULL
    );
  END IF;

  -- Return subscription data
  RETURN v_result;
END;
$$;

-- Create function to verify subscription
CREATE OR REPLACE FUNCTION verify_subscription(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription record;
BEGIN
  -- Get subscription data
  SELECT 
    status,
    current_period_end
  INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id;

  -- Return true if subscription is active or in trial period
  RETURN (
    v_subscription.status IN ('active', 'trialing') AND
    (
      v_subscription.status = 'trialing' OR
      (v_subscription.current_period_end IS NOT NULL AND v_subscription.current_period_end > now())
    )
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_subscription_status TO authenticated;
GRANT EXECUTE ON FUNCTION verify_subscription TO authenticated;