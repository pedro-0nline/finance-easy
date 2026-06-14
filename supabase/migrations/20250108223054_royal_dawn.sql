/*
  # Create recurring bills tables

  1. New Tables
    - `recurring_bills`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `amount` (numeric)
      - `due_day` (integer)
      - `last_generated_date` (date)
      - `created_at` (timestamptz)
    
    - `monthly_bills`
      - `id` (uuid, primary key)
      - `recurring_bill_id` (uuid, references recurring_bills)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `amount` (numeric)
      - `due_date` (date)
      - `paid` (boolean)
      - `paid_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own bills
*/

-- Create recurring_bills table
CREATE TABLE recurring_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL,
  due_day integer NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  last_generated_date date,
  created_at timestamptz DEFAULT now()
);

-- Create monthly_bills table
CREATE TABLE monthly_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_bill_id uuid REFERENCES recurring_bills NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  paid boolean DEFAULT false,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE recurring_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_bills ENABLE ROW LEVEL SECURITY;

-- Policies for recurring_bills
CREATE POLICY "Users can view own recurring bills"
  ON recurring_bills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recurring bills"
  ON recurring_bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring bills"
  ON recurring_bills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring bills"
  ON recurring_bills FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for monthly_bills
CREATE POLICY "Users can view own monthly bills"
  ON monthly_bills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own monthly bills"
  ON monthly_bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly bills"
  ON monthly_bills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly bills"
  ON monthly_bills FOR DELETE
  USING (auth.uid() = user_id);