/*
  # Update shared expenses schema

  1. Changes
    - Add subscription-related columns to shared_expenses table
    - Add recurring bill reference
    - Add payment tracking fields
  
  2. Security
    - Update RLS policies for new columns
*/

-- Add new columns for subscription handling
ALTER TABLE shared_expenses 
  ADD COLUMN is_subscription boolean DEFAULT false,
  ADD COLUMN recurring_bill_id uuid REFERENCES recurring_bills,
  ADD COLUMN last_payment_date timestamptz,
  ADD COLUMN next_payment_date timestamptz;

-- Add index for recurring bills
CREATE INDEX idx_shared_expenses_recurring_bill ON shared_expenses(recurring_bill_id);

-- Update existing RLS policies to include recurring bill access
CREATE POLICY "Users can view shared recurring bills they own or are shared with"
  ON recurring_bills FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM shared_expenses 
      WHERE recurring_bill_id = recurring_bills.id 
      AND (owner_id = auth.uid() OR shared_with = auth.uid())
    )
  );