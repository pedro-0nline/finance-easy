/*
  # Update RLS policies for monthly bills

  1. Changes
    - Add safety checks to prevent duplicate policy creation
    - Update existing policies if they exist
    - Ensure proper access control for monthly bills
*/

DO $$ 
BEGIN
  -- Enable RLS if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'monthly_bills' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE monthly_bills ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view own monthly bills" ON monthly_bills;
  DROP POLICY IF EXISTS "Users can insert own monthly bills" ON monthly_bills;
  DROP POLICY IF EXISTS "Users can update own monthly bills" ON monthly_bills;
  DROP POLICY IF EXISTS "Users can delete own monthly bills" ON monthly_bills;

  -- Create new policies
  CREATE POLICY "Users can view own monthly bills"
  ON monthly_bills FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM shared_expenses
      WHERE (shared_expenses.owner_id = auth.uid() OR shared_expenses.shared_with = auth.uid())
      AND shared_expenses.recurring_bill_id = monthly_bills.recurring_bill_id
    )
  );

  CREATE POLICY "Users can insert own monthly bills"
  ON monthly_bills FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM recurring_bills
      WHERE recurring_bills.id = monthly_bills.recurring_bill_id
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
END $$;