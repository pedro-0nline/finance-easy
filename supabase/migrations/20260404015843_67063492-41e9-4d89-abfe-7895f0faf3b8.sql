
CREATE TABLE public.custom_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  slug text NOT NULL,
  label text NOT NULL,
  icon text NOT NULL DEFAULT 'Tag',
  color text NOT NULL DEFAULT '#6366F1',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX custom_categories_user_slug ON public.custom_categories (user_id, slug);

CREATE POLICY "Users can manage own custom categories"
  ON public.custom_categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
