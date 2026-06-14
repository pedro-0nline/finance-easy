-- Group type: distinguishes a household/couple shared-finance group from general groups.
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'general'
CHECK (kind IN ('general', 'couple'));

-- Shared expense header
CREATE TABLE IF NOT EXISTS public.shared_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category public.category NOT NULL DEFAULT 'other',
  payment_method public.payment_method NOT NULL DEFAULT 'pix',
  total_amount numeric(12,2) NOT NULL CHECK (total_amount > 0),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  split_method text NOT NULL DEFAULT 'equal' CHECK (split_method IN ('equal', 'custom')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'settled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Shared expense participant breakdown (who should pay vs who actually paid)
CREATE TABLE IF NOT EXISTS public.shared_expense_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES public.shared_expenses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  should_pay numeric(12,2) NOT NULL DEFAULT 0 CHECK (should_pay >= 0),
  paid_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  note text NOT NULL DEFAULT '',
  UNIQUE (expense_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_shared_expenses_group_id ON public.shared_expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_shared_expense_participants_expense_id ON public.shared_expense_participants(expense_id);
CREATE INDEX IF NOT EXISTS idx_shared_expense_participants_user_id ON public.shared_expense_participants(user_id);

ALTER TABLE public.shared_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_expense_participants ENABLE ROW LEVEL SECURITY;

-- Shared expenses policies
CREATE POLICY "Members can view shared expenses"
ON public.shared_expenses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = shared_expenses.group_id
      AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can create shared expenses"
ON public.shared_expenses
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = shared_expenses.group_id
      AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Creator or owner can update shared expenses"
ON public.shared_expenses
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.groups g
    WHERE g.id = shared_expenses.group_id
      AND g.owner_id = auth.uid()
  )
)
WITH CHECK (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.groups g
    WHERE g.id = shared_expenses.group_id
      AND g.owner_id = auth.uid()
  )
);

CREATE POLICY "Creator or owner can delete shared expenses"
ON public.shared_expenses
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.groups g
    WHERE g.id = shared_expenses.group_id
      AND g.owner_id = auth.uid()
  )
);

-- Shared expense participants policies
CREATE POLICY "Members can view participants"
ON public.shared_expense_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.shared_expenses se
    JOIN public.group_members gm ON gm.group_id = se.group_id
    WHERE se.id = shared_expense_participants.expense_id
      AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can add participants"
ON public.shared_expense_participants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.shared_expenses se
    JOIN public.group_members gm ON gm.group_id = se.group_id
    WHERE se.id = shared_expense_participants.expense_id
      AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Participant or owner can update paid amount"
ON public.shared_expense_participants
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.shared_expenses se
    JOIN public.groups g ON g.id = se.group_id
    WHERE se.id = shared_expense_participants.expense_id
      AND g.owner_id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.shared_expenses se
    JOIN public.groups g ON g.id = se.group_id
    WHERE se.id = shared_expense_participants.expense_id
      AND g.owner_id = auth.uid()
  )
);

CREATE POLICY "Owner can delete participants"
ON public.shared_expense_participants
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.shared_expenses se
    JOIN public.groups g ON g.id = se.group_id
    WHERE se.id = shared_expense_participants.expense_id
      AND g.owner_id = auth.uid()
  )
);

-- Couple group members can view each other's transactions and accounts for combined dashboards.
CREATE POLICY "Couple members can view member transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.group_members gm_self
    JOIN public.group_members gm_target ON gm_target.group_id = gm_self.group_id
    JOIN public.groups g ON g.id = gm_self.group_id
    WHERE gm_self.user_id = auth.uid()
      AND gm_target.user_id = transactions.user_id
      AND g.kind = 'couple'
  )
);

CREATE POLICY "Couple members can view member bank accounts"
ON public.bank_accounts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.group_members gm_self
    JOIN public.group_members gm_target ON gm_target.group_id = gm_self.group_id
    JOIN public.groups g ON g.id = gm_self.group_id
    WHERE gm_self.user_id = auth.uid()
      AND gm_target.user_id = bank_accounts.user_id
      AND g.kind = 'couple'
  )
);

CREATE POLICY "Couple members can view member credit cards"
ON public.credit_cards
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.group_members gm_self
    JOIN public.group_members gm_target ON gm_target.group_id = gm_self.group_id
    JOIN public.groups g ON g.id = gm_self.group_id
    WHERE gm_self.user_id = auth.uid()
      AND gm_target.user_id = credit_cards.user_id
      AND g.kind = 'couple'
  )
);
