/*
  # Initial Schema Setup

  1. New Tables
    - `receipts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `amount` (numeric, not null)
      - `reference_month` (date, not null)
      - `file_url` (text, not null)
      - `description` (text)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `receipts` table
    - Add policies for CRUD operations
*/

CREATE TABLE receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  amount numeric NOT NULL,
  reference_month date NOT NULL,
  file_url text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own receipts
CREATE POLICY "Users can view own receipts" 
  ON receipts FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own receipts
CREATE POLICY "Users can insert own receipts" 
  ON receipts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own receipts
CREATE POLICY "Users can update own receipts" 
  ON receipts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own receipts
CREATE POLICY "Users can delete own receipts" 
  ON receipts FOR DELETE 
  USING (auth.uid() = user_id);