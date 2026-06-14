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
  -- Get the recurring bill and verify ownership in one step
  SELECT * INTO v_recurring_bill
  FROM recurring_bills
  WHERE id = p_recurring_bill_id
  AND user_id = p_user_id;

  -- Check if the recurring bill exists and belongs to the user
  IF v_recurring_bill.id IS NULL THEN
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
REVOKE EXECUTE ON FUNCTION generate_monthly_bills_bypass_rls FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION generate_monthly_bills_bypass_rls FROM authenticated;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_monthly_bills_bypass_rls TO authenticated;

-- Recreate RLS policies with proper checks
DROP POLICY IF EXISTS "Users can view own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can update own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can delete own monthly bills" ON monthly_bills;

CREATE POLICY "Users can view own monthly bills"
ON monthly_bills FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM recurring_bills
    WHERE recurring_bills.id = monthly_bills.recurring_bill_id
    AND recurring_bills.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own monthly bills"
ON monthly_bills FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly bills"
ON monthly_bills FOR DELETE
TO authenticated
USING (auth.uid() = user_id);