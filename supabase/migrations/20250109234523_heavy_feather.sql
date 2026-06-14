-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can insert own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can update own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can delete own monthly bills" ON monthly_bills;

-- Create a security definer function to handle bill generation
CREATE OR REPLACE FUNCTION generate_monthly_bills_secure(
  p_recurring_bill_id uuid,
  p_user_id uuid,
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
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM recurring_bills
    WHERE id = p_recurring_bill_id
    AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Get recurring bill details
  SELECT * INTO v_recurring_bill
  FROM recurring_bills
  WHERE id = p_recurring_bill_id;

  -- Insert the monthly bill
  INSERT INTO monthly_bills (
    recurring_bill_id,
    user_id,
    name,
    amount,
    due_date,
    paid
  ) VALUES (
    v_recurring_bill.id,
    v_recurring_bill.user_id,
    v_recurring_bill.name,
    v_recurring_bill.amount,
    p_due_date,
    false
  )
  RETURNING id INTO v_bill_id;

  RETURN v_bill_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_monthly_bills_secure TO authenticated;

-- Create new RLS policies
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

CREATE POLICY "Users can insert own monthly bills"
ON monthly_bills FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  (
    recurring_bill_id IS NULL OR
    EXISTS (
      SELECT 1 FROM recurring_bills
      WHERE recurring_bills.id = recurring_bill_id
      AND recurring_bills.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update own monthly bills"
ON monthly_bills FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM recurring_bills
    WHERE recurring_bills.id = monthly_bills.recurring_bill_id
    AND recurring_bills.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own monthly bills"
ON monthly_bills FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM recurring_bills
    WHERE recurring_bills.id = monthly_bills.recurring_bill_id
    AND recurring_bills.user_id = auth.uid()
  )
);