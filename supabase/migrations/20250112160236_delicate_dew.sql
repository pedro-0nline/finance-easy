-- Drop existing function
DROP FUNCTION IF EXISTS generate_monthly_bills_bypass_rls;

-- Create a new version of the function with proper security checks
CREATE OR REPLACE FUNCTION generate_monthly_bills_bypass_rls(
  p_recurring_bill_id uuid,
  p_user_id uuid,
  p_name text,
  p_amount numeric,
  p_due_date date
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_bill_id uuid;
  v_recurring_bill recurring_bills%ROWTYPE;
BEGIN
  -- Get the recurring bill
  SELECT * INTO v_recurring_bill
  FROM recurring_bills
  WHERE id = p_recurring_bill_id;

  -- Check if the recurring bill exists
  IF v_recurring_bill.id IS NULL THEN
    RAISE EXCEPTION 'Recurring bill not found';
  END IF;

  -- Check if the user owns the recurring bill or has access through shared_expenses
  IF NOT EXISTS (
    SELECT 1 
    FROM recurring_bills rb
    LEFT JOIN shared_expenses se ON rb.id = se.recurring_bill_id
    WHERE rb.id = p_recurring_bill_id
    AND (rb.user_id = p_user_id OR se.shared_with = p_user_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Check if a bill for this date already exists
  IF EXISTS (
    SELECT 1 FROM monthly_bills
    WHERE recurring_bill_id = p_recurring_bill_id
    AND due_date = p_due_date
  ) THEN
    RETURN NULL; -- Return null instead of creating a duplicate
  END IF;

  -- Insert the monthly bill
  INSERT INTO monthly_bills (
    recurring_bill_id,
    user_id,
    name,
    amount,
    due_date,
    paid
  ) VALUES (
    p_recurring_bill_id,
    p_user_id,
    p_name,
    p_amount,
    p_due_date,
    false
  )
  RETURNING id INTO v_bill_id;

  -- Update the last_generated_date of the recurring bill
  UPDATE recurring_bills
  SET last_generated_date = CURRENT_DATE
  WHERE id = p_recurring_bill_id;

  RETURN v_bill_id;
END;
$$;

-- Revoke all existing permissions
REVOKE ALL ON FUNCTION generate_monthly_bills_bypass_rls FROM PUBLIC;
REVOKE ALL ON FUNCTION generate_monthly_bills_bypass_rls FROM authenticated;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_monthly_bills_bypass_rls TO authenticated;