
-- Allow authenticated users to find groups by invite code (for joining)
CREATE POLICY "Anyone can find groups by invite code"
ON public.groups FOR SELECT
TO authenticated
USING (true);

-- Allow users to insert themselves as members
CREATE POLICY "Users can join groups"
ON public.group_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
