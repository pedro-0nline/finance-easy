-- Create function to generate monthly bills
CREATE OR REPLACE FUNCTION generate_monthly_bill(
  p_recurring_bill_id uuid,
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
  -- Get recurring bill details
  SELECT * INTO v_recurring_bill
  FROM recurring_bills
  WHERE id = p_recurring_bill_id;

  -- Only create bill if it doesn't exist yet
  IF NOT EXISTS (
    SELECT 1 FROM monthly_bills 
    WHERE recurring_bill_id = p_recurring_bill_id 
    AND due_date = p_due_date
  ) THEN
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

    -- Update last generated date
    UPDATE recurring_bills 
    SET last_generated_date = CURRENT_DATE
    WHERE id = p_recurring_bill_id;
  END IF;

  RETURN v_bill_id;
END;
$$;

-- Create function to check if bill needs generation
CREATE OR REPLACE FUNCTION should_generate_monthly_bill(
  p_recurring_bill_id uuid,
  p_target_date date
)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_generated date;
  v_due_day integer;
BEGIN
  SELECT last_generated_date, due_day 
  INTO v_last_generated, v_due_day
  FROM recurring_bills 
  WHERE id = p_recurring_bill_id;

  RETURN (
    v_last_generated IS NULL OR
    DATE_TRUNC('month', v_last_generated) < DATE_TRUNC('month', p_target_date)
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_monthly_bill(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION should_generate_monthly_bill(uuid, date) TO authenticated;