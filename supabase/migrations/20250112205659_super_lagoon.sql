-- Create helper function to handle subscription status
CREATE OR REPLACE FUNCTION handle_subscription_status(
  p_user_id uuid,
  p_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription record;
  v_result jsonb;
BEGIN
  -- Get subscription data from Stripe
  SELECT * INTO v_subscription
  FROM get_stripe_subscription_by_email(p_email) 
  LIMIT 1;

  -- If subscription exists, update or insert into subscriptions table
  IF v_subscription.subscription_id IS NOT NULL THEN
    INSERT INTO subscriptions (
      user_id,
      stripe_customer_id,
      stripe_subscription_id,
      status,
      current_period_end,
      updated_at
    ) VALUES (
      p_user_id,
      v_subscription.customer_id,
      v_subscription.subscription_id,
      v_subscription.status,
      v_subscription.current_period_end,
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      stripe_customer_id = EXCLUDED.stripe_customer_id,
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      status = EXCLUDED.status,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = now();

    v_result = jsonb_build_object(
      'subscription_id', v_subscription.subscription_id,
      'customer_id', v_subscription.customer_id,
      'status', v_subscription.status,
      'current_period_end', v_subscription.current_period_end
    );
  ELSE
    v_result = jsonb_build_object(
      'status', 'no_subscription'
    );
  END IF;

  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_subscription_status TO authenticated;