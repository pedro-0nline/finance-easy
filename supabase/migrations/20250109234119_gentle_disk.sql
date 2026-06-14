/*
  # Fix monthly bills RLS policies and triggers

  1. Changes
    - Drop and recreate RLS policies for monthly bills
    - Add trigger for automatic user_id assignment
    - Ensure proper permissions for bill generation
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can insert own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can update own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can delete own monthly bills" ON monthly_bills;

-- Create simplified policies
CREATE POLICY "Users can view own monthly bills"
ON monthly_bills FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly bills"
ON monthly_bills FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly bills"
ON monthly_bills FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly bills"
ON monthly_bills FOR DELETE
USING (auth.uid() = user_id);

-- Create function for monthly bill generation
CREATE OR REPLACE FUNCTION handle_monthly_bill_generation()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set user_id from the recurring bill if not provided
  IF NEW.user_id IS NULL THEN
    SELECT user_id INTO NEW.user_id
    FROM recurring_bills
    WHERE id = NEW.recurring_bill_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS monthly_bill_generation_trigger ON monthly_bills;

-- Create trigger for monthly bills
CREATE TRIGGER monthly_bill_generation_trigger
  BEFORE INSERT ON monthly_bills
  FOR EACH ROW
  EXECUTE FUNCTION handle_monthly_bill_generation();