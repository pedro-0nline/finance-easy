-- Drop existing function
DROP FUNCTION IF EXISTS handle_subscription_status;

-- Create function to handle subscription status
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
  v_customer record;
  v_subscription record;
  v_status text;
  v_period_end timestamptz;
BEGIN
  -- Get most recent customer data by created timestamp
  SELECT * INTO v_customer
  FROM stripe_costumer
  WHERE attrs->>'email' = p_email
  ORDER BY (attrs->>'created')::bigint DESC
  LIMIT 1;

  IF v_customer IS NULL THEN
    RETURN jsonb_build_object('status', 'no_customer');
  END IF;

  -- Get most recent subscription data by created timestamp
  SELECT * INTO v_subscription
  FROM stripe_subscription
  WHERE customer = v_customer.id
  ORDER BY (attrs->>'created')::bigint DESC, current_period_end DESC
  LIMIT 1;

  -- Determine subscription status
  IF v_subscription IS NULL THEN
    v_status := 'inactive';
    v_period_end := NULL;
  ELSE
    v_period_end := COALESCE(v_subscription.current_period_end, (v_subscription.attrs->>'current_period_end')::timestamptz);
    
    v_status := CASE 
      WHEN v_subscription.attrs->>'status' = 'trialing' THEN 'trialing'
      WHEN v_subscription.attrs->>'status' = 'active' AND v_period_end > now() THEN 'active'
      ELSE 'inactive'
    END;
  END IF;

  -- Update subscriptions table
  INSERT INTO subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    status,
    current_period_end,
    updated_at
  )
  VALUES (
    p_user_id,
    v_customer.id,
    v_subscription.id,
    v_status,
    v_period_end,
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    status = EXCLUDED.status,
    current_period_end = EXCLUDED.current_period_end,
    updated_at = now();

  -- Return subscription data
  RETURN jsonb_build_object(
    'customer_id', v_customer.id,
    'subscription_id', v_subscription.id,
    'status', v_status,
    'current_period_end', v_period_end
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_subscription_status TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION handle_subscription_status IS 'Handles subscription status check and updates using stripe_costumer and stripe_subscription tables, selecting the most recently created customer and subscription when duplicates exist';