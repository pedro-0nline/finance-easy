/*
  # Fix monthly bills RLS and permissions

  1. Changes
    - Drop and recreate RLS policies with proper recursive checks
    - Add function to handle user_id assignment with proper permissions
    - Ensure proper security context for trigger function
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can insert own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can update own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can delete own monthly bills" ON monthly_bills;

-- Create new policies with proper recursive checks
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
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM recurring_bills
    WHERE recurring_bills.id = recurring_bill_id
    AND recurring_bills.user_id = auth.uid()
  )
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

-- Create secure function to handle user_id assignment
CREATE OR REPLACE FUNCTION handle_monthly_bill_user_id()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user_id from recurring bill
  SELECT user_id INTO v_user_id
  FROM recurring_bills
  WHERE id = NEW.recurring_bill_id;

  -- Set the user_id
  NEW.user_id := v_user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic user_id assignment
DROP TRIGGER IF EXISTS monthly_bill_user_id_trigger ON monthly_bills;
CREATE TRIGGER monthly_bill_user_id_trigger
  BEFORE INSERT ON monthly_bills
  FOR EACH ROW
  EXECUTE FUNCTION handle_monthly_bill_user_id();