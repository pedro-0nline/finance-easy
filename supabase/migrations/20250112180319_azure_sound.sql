/*
  # Subscription System Setup

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `stripe_customer_id` (text)
      - `stripe_subscription_id` (text)
      - `status` (text)
      - `current_period_end` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on subscriptions table
    - Add policies for authenticated users
    - Create functions for subscription checks
*/

-- Create subscriptions table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'subscriptions'
  ) THEN
    CREATE TABLE subscriptions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users NOT NULL,
      stripe_customer_id text,
      stripe_subscription_id text,
      status text NOT NULL DEFAULT 'incomplete',
      current_period_end timestamptz,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(user_id)
    );

    -- Enable RLS
    ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
  DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
  DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create new policies
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS is_subscription_active(uuid);
DROP FUNCTION IF EXISTS handle_subscription_update();

-- Create function to check if subscription is active
CREATE OR REPLACE FUNCTION is_subscription_active(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE user_id = check_user_id
    AND status IN ('active', 'trialing')
    AND (
      status = 'trialing' OR
      (current_period_end IS NOT NULL AND current_period_end > now())
    )
  );
END;
$$;

-- Create function to handle subscription updates
CREATE OR REPLACE FUNCTION handle_subscription_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update updated_at timestamp
  NEW.updated_at := now();
  
  -- If subscription is canceled, update user metadata
  IF NEW.status = 'canceled' AND OLD.status != 'canceled' THEN
    UPDATE auth.users
    SET raw_app_meta_data = 
      raw_app_meta_data || 
      jsonb_build_object('subscription_blocked', true)
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS subscription_update_trigger ON subscriptions;

-- Create trigger for subscription updates
CREATE TRIGGER subscription_update_trigger
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_update();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_subscription_active TO authenticated;