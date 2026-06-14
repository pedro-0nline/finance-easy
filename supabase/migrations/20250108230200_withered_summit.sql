-- Add email column to shared_expenses table
ALTER TABLE shared_expenses
ADD COLUMN shared_with_email text NOT NULL;

-- Create index for email lookups
CREATE INDEX idx_shared_expenses_email ON shared_expenses(shared_with_email);