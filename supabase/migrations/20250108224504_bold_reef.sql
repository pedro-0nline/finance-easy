/*
  # Add categories and expense sharing

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `color` (text)
      - `created_at` (timestamptz)

    - `shared_expenses`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, references auth.users)
      - `shared_with` (uuid, references auth.users)
      - `bill_id` (uuid, references bills)
      - `split_percentage` (numeric)
      - `status` (text)
      - `created_at` (timestamptz)

  2. Changes
    - Add `category_id` to bills, receipts, and recurring_bills tables
    - Add indexes for better query performance

  3. Security
    - Enable RLS on new tables
    - Add policies for secure data access
*/

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  color text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create shared_expenses table
CREATE TABLE shared_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users NOT NULL,
  shared_with uuid REFERENCES auth.users NOT NULL,
  bill_id uuid REFERENCES bills NOT NULL,
  split_percentage numeric NOT NULL CHECK (split_percentage > 0 AND split_percentage <= 100),
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'paid')),
  created_at timestamptz DEFAULT now()
);

-- Add category_id to existing tables
ALTER TABLE bills ADD COLUMN category_id uuid REFERENCES categories;
ALTER TABLE receipts ADD COLUMN category_id uuid REFERENCES categories;
ALTER TABLE recurring_bills ADD COLUMN category_id uuid REFERENCES categories;

-- Create indexes
CREATE INDEX idx_bills_category ON bills(category_id);
CREATE INDEX idx_receipts_category ON receipts(category_id);
CREATE INDEX idx_recurring_bills_category ON recurring_bills(category_id);
CREATE INDEX idx_shared_expenses_bill ON shared_expenses(bill_id);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_expenses ENABLE ROW LEVEL SECURITY;

-- Policies for categories
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for shared_expenses
CREATE POLICY "Users can view shared expenses they own or are shared with"
  ON shared_expenses FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = shared_with);

CREATE POLICY "Users can create shared expenses they own"
  ON shared_expenses FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update shared expenses they own or are shared with"
  ON shared_expenses FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = shared_with);

CREATE POLICY "Users can delete shared expenses they own"
  ON shared_expenses FOR DELETE
  USING (auth.uid() = owner_id);