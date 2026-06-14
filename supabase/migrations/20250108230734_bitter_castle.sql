/*
  # Fix shared expenses schema for recurring bills
  
  1. Changes
    - Make bill_id column nullable to support recurring bills
    - Update trigger function to handle null bill_id
*/

-- Make bill_id nullable
ALTER TABLE shared_expenses 
ALTER COLUMN bill_id DROP NOT NULL;

-- Update trigger function to handle null bill_id
CREATE OR REPLACE FUNCTION update_shared_expense_bill_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.recurring_bill_id IS NOT NULL THEN
    SELECT name INTO NEW.bill_name
    FROM recurring_bills
    WHERE id = NEW.recurring_bill_id;
  ELSIF NEW.bill_id IS NOT NULL THEN
    SELECT name INTO NEW.bill_name
    FROM bills
    WHERE id = NEW.bill_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;