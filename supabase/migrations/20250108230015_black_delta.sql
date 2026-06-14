/*
  # Add secure user lookup function
  
  1. New Functions
    - `lookup_user_by_email` - Securely look up user IDs by email
  2. Security
    - Function is security definer to access auth.users safely
    - Only authenticated users can use the function
*/

-- Create a secure function to look up users by email
CREATE OR REPLACE FUNCTION public.lookup_user_by_email(lookup_email text)
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow authenticated users to look up emails
  IF auth.role() = 'authenticated' THEN
    RETURN QUERY
    SELECT u.id, u.email, u.created_at
    FROM auth.users u
    WHERE u.email = lookup_email;
  ELSE
    RAISE EXCEPTION 'Not authenticated';
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.lookup_user_by_email(text) TO authenticated;

-- Revoke execute from public
REVOKE EXECUTE ON FUNCTION public.lookup_user_by_email(text) FROM public;