/*
  # Add recurring bill sharing support
  
  1. Changes
    - Add bill name column to shared expenses
    - Add trigger to maintain bill names
    - Update RLS policies for recurring bills
    - Add function to handle recurring bill sharing
*/

-- Add bill name column (not generated)
ALTER TABLE shared_expenses
ADD COLUMN bill_name text;

-- Create trigger function to maintain bill name
CREATE OR REPLACE FUNCTION update_shared_expense_bill_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.recurring_bill_id IS NOT NULL THEN
    SELECT name INTO NEW.bill_name
    FROM recurring_bills
    WHERE id = NEW.recurring_bill_id;
  ELSE
    SELECT name INTO NEW.bill_name
    FROM bills
    WHERE id = NEW.bill_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER shared_expense_bill_name_trigger
  BEFORE INSERT OR UPDATE ON shared_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_expense_bill_name();

-- Update shared_expenses policies to include recurring bills
CREATE POLICY "Users can view shared recurring bills"
  ON recurring_bills FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM shared_expenses 
      WHERE recurring_bill_id = recurring_bills.id 
      AND (shared_with = auth.uid() OR owner_id = auth.uid())
    )
  );

-- Function to share recurring bill
CREATE OR REPLACE FUNCTION share_recurring_bill(
  p_recurring_bill_id uuid,
  p_shared_with_email text,
  p_split_percentage numeric
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_shared_user_id text;
  v_shared_expense_id uuid;
BEGIN
  -- Get the shared user's ID
  SELECT id INTO v_shared_user_id
  FROM public.lookup_user_by_email(p_shared_with_email) 
  LIMIT 1;
  
  IF v_shared_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Create shared expense record
  INSERT INTO shared_expenses (
    recurring_bill_id,
    owner_id,
    shared_with,
    shared_with_email,
    split_percentage,
    status,
    is_subscription
  ) VALUES (
    p_recurring_bill_id,
    auth.uid(),
    v_shared_user_id::uuid,
    p_shared_with_email,
    p_split_percentage,
    'pending',
    true
  ) RETURNING id INTO v_shared_expense_id;

  RETURN v_shared_expense_id;
END;
$$;