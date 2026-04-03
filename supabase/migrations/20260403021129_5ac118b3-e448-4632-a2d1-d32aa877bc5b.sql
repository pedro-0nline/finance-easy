
-- Enums
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense', 'recurring', 'fixed');
CREATE TYPE public.payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'pix', 'transfer', 'boleto');
CREATE TYPE public.category AS ENUM ('food', 'health', 'transport', 'education', 'leisure', 'housing', 'utilities', 'other');
CREATE TYPE public.group_role AS ENUM ('owner', 'manager', 'editor', 'viewer');
CREATE TYPE public.insight_type AS ENUM ('analysis', 'recommendation', 'alert', 'opportunity');
CREATE TYPE public.insight_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE public.account_type AS ENUM ('checking', 'savings', 'investment');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar_url TEXT,
  currency TEXT NOT NULL DEFAULT 'BRL',
  first_day_of_week INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Bank Accounts
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.account_type NOT NULL DEFAULT 'checking',
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  institution TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#6366F1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own bank accounts" ON public.bank_accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Credit Cards
CREATE TABLE public.credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  credit_limit NUMERIC(12,2) NOT NULL DEFAULT 0,
  used NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_day INT NOT NULL DEFAULT 10,
  closing_day INT NOT NULL DEFAULT 3,
  institution TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#6366F1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own credit cards" ON public.credit_cards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.transaction_type NOT NULL DEFAULT 'expense',
  category public.category NOT NULL DEFAULT 'other',
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method public.payment_method NOT NULL DEFAULT 'pix',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_installment BOOLEAN NOT NULL DEFAULT false,
  installment_number INT,
  total_installments INT,
  installment_group_id UUID,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  shared_with JSONB DEFAULT '[]'::jsonb,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Budgets
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category public.category NOT NULL,
  budget_limit NUMERIC(12,2) NOT NULL DEFAULT 0,
  spent NUMERIC(12,2) NOT NULL DEFAULT 0,
  month TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, month)
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Goals
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  deadline DATE NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366F1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own goals" ON public.goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Groups
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Group Members
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  role public.group_role NOT NULL DEFAULT 'viewer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Group RLS: members can view their groups
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

CREATE POLICY "Group owners can manage groups" ON public.groups FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Members can view their groups" ON public.groups FOR SELECT USING (public.is_group_member(auth.uid(), id));

CREATE POLICY "Members can view group members" ON public.group_members FOR SELECT USING (public.is_group_member(auth.uid(), group_id));
CREATE POLICY "Group owners can manage members" ON public.group_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid())
);

-- Insights
CREATE TABLE public.insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.insight_type NOT NULL DEFAULT 'analysis',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority public.insight_priority NOT NULL DEFAULT 'medium',
  action_taken BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own insights" ON public.insights FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON public.credit_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
