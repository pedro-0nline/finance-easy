-- First, delete pending monthly bills for the specified user
DELETE FROM monthly_bills
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'telhado.folha'
);

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can insert own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can update own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can delete own monthly bills" ON monthly_bills;

-- Create a more permissive policy for bill generation
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
  CASE
    WHEN auth.uid() = user_id THEN true
    WHEN recurring_bill_id IS NOT NULL THEN
      EXISTS (
        SELECT 1 FROM recurring_bills
        WHERE recurring_bills.id = recurring_bill_id
        AND recurring_bills.user_id = auth.uid()
      )
    ELSE false
  END
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