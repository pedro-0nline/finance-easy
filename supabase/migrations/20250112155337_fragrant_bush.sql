-- Add type column with default value
ALTER TABLE receipts ADD COLUMN type text DEFAULT 'expense';

-- Make type column required after setting default
ALTER TABLE receipts ALTER COLUMN type SET NOT NULL;