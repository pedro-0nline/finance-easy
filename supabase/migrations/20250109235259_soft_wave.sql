/*
  # Final fix for monthly bills RLS and generation

  1. Changes
    - Simplifies RLS policies to focus on direct ownership
    - Creates a secure function for bill generation that properly handles user_id
    - Removes unnecessary complexity from previous approaches
    
  2. Security
    - Strict ownership verification in the generation function
    - Direct user_id checks in RLS policies
    - No shared access to prevent policy conflicts
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can insert own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can update own monthly bills" ON monthly_bills;
DROP POLICY IF EXISTS "Users can delete own monthly bills" ON monthly_bills;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS generate_monthly_bills_bypass_rls;

-- Create a new security definer function with strict ownership checks
CREATE OR REPLACE FUNCTION generate_monthly_bills_bypass_rls(
  p_recurring_bill_id uuid,
  p_user_id uuid,
  p_name text,
  p_amount numeric,
  p_due_date date
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_bill_id uuid;
  v_owner_id uuid;
BEGIN
  -- Get the owner of the recurring bill
  SELECT user_id INTO v_owner_id
  FROM recurring_bills
  WHERE id = p_recurring_bill_id;

  -- Verify ownership
  IF v_owner_id IS NULL OR v_owner_id != p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Insert the monthly bill with the verified user_id
  INSERT INTO monthly_bills (
    recurring_bill_id,
    user_id,
    name,
    amount,
    due_date,
    paid
  ) VALUES (
    p_recurring_bill_id,
    p_user_id,
    p_name,
    p_amount,
    p_due_date,
    false
  )
  RETURNING id INTO v_bill_id;

  RETURN v_bill_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_monthly_bills_bypass_rls TO authenticated;

-- Create simplified RLS policies that focus on direct ownership
CREATE POLICY "Users can view own monthly bills"
ON monthly_bills FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly bills"
ON monthly_bills FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly bills"
ON monthly_bills FOR DELETE
TO authenticated
USING (auth.uid() = user_id);