-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.lookup_user_by_email(text);

-- Create a secure function to look up users by email with correct types
CREATE OR REPLACE FUNCTION public.lookup_user_by_email(lookup_email text)
RETURNS TABLE (
  id text,
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
    SELECT 
      u.id::text,
      u.email::text,
      u.created_at
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