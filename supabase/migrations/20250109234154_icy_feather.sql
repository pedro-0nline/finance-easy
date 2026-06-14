/*
  # Fix monthly bills RLS and user handling

  1. Changes
    - Drop and recreate RLS policies with proper user_id handling
    - Add function to properly set user_id from recurring bills
    - Add trigger to automatically handle user_id assignment
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can insert own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can update own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can delete own monthly bills" ON monthly_bills;

-- Create new policies with proper user_id handling
CREATE POLICY "Users can view own monthly bills"
ON monthly_bills FOR SELECT
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
WITH CHECK (
  CASE 
    WHEN user_id IS NOT NULL THEN auth.uid() = user_id
    WHEN recurring_bill_id IS NOT NULL THEN EXISTS (
      SELECT 1 FROM recurring_bills
      WHERE recurring_bills.id = recurring_bill_id
      AND recurring_bills.user_id = auth.uid()
    )
    ELSE false
  END
);

CREATE POLICY "Users can update own monthly bills"
ON monthly_bills FOR UPDATE
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
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM recurring_bills
    WHERE recurring_bills.id = monthly_bills.recurring_bill_id
    AND recurring_bills.user_id = auth.uid()
  )
);

-- Create function to handle user_id assignment
CREATE OR REPLACE FUNCTION set_monthly_bill_user_id()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    SELECT user_id INTO NEW.user_id
    FROM recurring_bills
    WHERE id = NEW.recurring_bill_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically set user_id
DROP TRIGGER IF EXISTS set_monthly_bill_user_id_trigger ON monthly_bills;
CREATE TRIGGER set_monthly_bill_user_id_trigger
  BEFORE INSERT ON monthly_bills
  FOR EACH ROW
  EXECUTE FUNCTION set_monthly_bill_user_id();