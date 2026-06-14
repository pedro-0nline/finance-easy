-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can insert own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can update own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can delete own monthly bills" ON monthly_bills;

-- Create new policies with proper security checks
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
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM recurring_bills
    WHERE recurring_bills.id = recurring_bill_id
    AND recurring_bills.user_id = auth.uid()
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