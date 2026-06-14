/*
  # Create bills management tables

  1. New Tables
    - `bills`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `total_amount` (numeric)
      - `installments` (integer)
      - `due_date` (date)
      - `status` (text)
      - `created_at` (timestamptz)
    
    - `bill_installments`
      - `id` (uuid, primary key)
      - `bill_id` (uuid, references bills)
      - `installment_number` (integer)
      - `amount` (numeric)
      - `due_date` (date)
      - `paid` (boolean)
      - `paid_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

CREATE TABLE bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  total_amount numeric NOT NULL,
  installments integer NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE bill_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid REFERENCES bills NOT NULL,
  installment_number integer NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  paid boolean DEFAULT false,
  paid_at timestamptz
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_installments ENABLE ROW LEVEL SECURITY;

-- Bills policies
CREATE POLICY "Users can view own bills" 
  ON bills FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bills" 
  ON bills FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bills" 
  ON bills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bills" 
  ON bills FOR DELETE 
  USING (auth.uid() = user_id);

-- Bill installments policies
CREATE POLICY "Users can view own bill installments" 
  ON bill_installments FOR SELECT 
  USING ((SELECT user_id FROM bills WHERE id = bill_id) = auth.uid());

CREATE POLICY "Users can insert own bill installments" 
  ON bill_installments FOR INSERT 
  WITH CHECK ((SELECT user_id FROM bills WHERE id = bill_id) = auth.uid());

CREATE POLICY "Users can update own bill installments" 
  ON bill_installments FOR UPDATE
  USING ((SELECT user_id FROM bills WHERE id = bill_id) = auth.uid());

CREATE POLICY "Users can delete own bill installments" 
  ON bill_installments FOR DELETE 
  USING ((SELECT user_id FROM bills WHERE id = bill_id) = auth.uid());