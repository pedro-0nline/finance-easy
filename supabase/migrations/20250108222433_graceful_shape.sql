/*
  # Update bills table structure for installment amounts

  1. Changes
    - Add new column `installment_amount` to bills table
    - Update existing records (if any)
    - Drop old total_amount column
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add new column for installment amount
ALTER TABLE bills ADD COLUMN installment_amount numeric;

-- Update existing records if any exist
UPDATE bills 
SET installment_amount = total_amount / installments 
WHERE installment_amount IS NULL;

-- Make the new column required
ALTER TABLE bills ALTER COLUMN installment_amount SET NOT NULL;

-- Drop the old column
ALTER TABLE bills DROP COLUMN total_amount;

-- Update bill_installments to use the new amount
UPDATE bill_installments bi
SET amount = (
  SELECT installment_amount 
  FROM bills 
  WHERE bills.id = bi.bill_id
);