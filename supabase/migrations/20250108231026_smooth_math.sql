/*
  # Add optional categories to bills, receipts, and recurring bills
  
  1. Changes
    - Add category_id foreign key to bills, receipts, and recurring_bills tables
    - Add indexes for better performance
    - Add RLS policies for categories
*/

-- Add category_id to bills if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bills' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE bills ADD COLUMN category_id uuid REFERENCES categories;
    CREATE INDEX idx_bills_category ON bills(category_id);
  END IF;
END $$;

-- Add category_id to receipts if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'receipts' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE receipts ADD COLUMN category_id uuid REFERENCES categories;
    CREATE INDEX idx_receipts_category ON receipts(category_id);
  END IF;
END $$;

-- Add category_id to recurring_bills if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_bills' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE recurring_bills ADD COLUMN category_id uuid REFERENCES categories;
    CREATE INDEX idx_recurring_bills_category ON recurring_bills(category_id);
  END IF;
END $$;

-- Add RLS policies for categories if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' AND policyname = 'Users can view own categories'
  ) THEN
    CREATE POLICY "Users can view own categories"
      ON categories FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' AND policyname = 'Users can create own categories'
  ) THEN
    CREATE POLICY "Users can create own categories"
      ON categories FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' AND policyname = 'Users can update own categories'
  ) THEN
    CREATE POLICY "Users can update own categories"
      ON categories FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' AND policyname = 'Users can delete own categories'
  ) THEN
    CREATE POLICY "Users can delete own categories"
      ON categories FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;