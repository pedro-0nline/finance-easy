-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can find groups by invite code" ON public.groups;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;

-- Secure function to join a group by invite code
CREATE OR REPLACE FUNCTION public.join_group_by_code(_invite_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _group_id uuid;
  _user_id uuid := auth.uid();
  _name text;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO _group_id
  FROM public.groups
  WHERE invite_code = upper(_invite_code);

  IF _group_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = _user_id
  ) THEN
    RAISE EXCEPTION 'Already a member';
  END IF;

  SELECT COALESCE(name, '') INTO _name FROM public.profiles WHERE id = _user_id;

  INSERT INTO public.group_members (group_id, user_id, role, name)
  VALUES (_group_id, _user_id, 'viewer', _name);

  RETURN _group_id;
END;
$$;

-- Lock down function execution
REVOKE EXECUTE ON FUNCTION public.join_group_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_group_by_code(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;