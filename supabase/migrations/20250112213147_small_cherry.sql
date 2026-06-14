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
  v_customer_attrs jsonb;
  v_subscription_attrs jsonb;
  v_subscription_status text;
  v_period_end timestamptz;
BEGIN
  -- Get customer and subscription data
  SELECT 
    c.attrs as customer_attrs,
    s.attrs as subscription_attrs,
    s.status,
    COALESCE(
      s.current_period_end,
      (s.attrs->>'current_period_end')::timestamptz
    ) as period_end
  INTO 
    v_customer_attrs,
    v_subscription_attrs,
    v_subscription_status,
    v_period_end
  FROM stripe_costumer c
  LEFT JOIN stripe_subscription s ON s.customer = c.id
  WHERE c.attrs->>'email' = p_email
  ORDER BY s.current_period_end DESC
  LIMIT 1;

  -- Update subscriptions table with latest data
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
    v_customer_attrs->>'id',
    v_subscription_attrs->>'id',
    CASE 
      WHEN v_subscription_status = 'trialing' THEN 'trialing'
      WHEN v_subscription_status = 'active' AND v_period_end > now() THEN 'active'
      ELSE 'inactive'
    END,
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
    'customer_id', v_customer_attrs->>'id',
    'subscription_id', v_subscription_attrs->>'id',
    'status', CASE 
      WHEN v_subscription_status = 'trialing' THEN 'trialing'
      WHEN v_subscription_status = 'active' AND v_period_end > now() THEN 'active'
      ELSE 'inactive'
    END,
    'current_period_end', v_period_end
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_subscription_status TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION handle_subscription_status IS 'Handles subscription status check and updates using stripe_costumer and stripe_subscription tables';