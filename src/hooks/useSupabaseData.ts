import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// ─── Transactions ────────────────────────────────────────────
export function useTransactions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAddTransaction() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (t: {
      type: string; category: string; description: string; amount: number;
      payment_method: string; date: string; is_installment: boolean;
      installment_number?: number; total_installments?: number;
      installment_group_id?: string; is_shared: boolean;
      shared_with?: any; is_paid: boolean; notes?: string;
    }) => {
      const { error } = await supabase.from('transactions').insert([{ ...t, user_id: user!.id } as any]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}

export function useTogglePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isPaid }: { id: string; isPaid: boolean }) => {
      const { error } = await supabase.from('transactions').update({ is_paid: !isPaid }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}

// ─── Bank Accounts ───────────────────────────────────────────
export function useBankAccounts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['bank_accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('bank_accounts').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// ─── Credit Cards ────────────────────────────────────────────
export function useCreditCards() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['credit_cards', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('credit_cards').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// ─── Budgets ─────────────────────────────────────────────────
export function useBudgets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['budgets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('budgets').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// ─── Goals ───────────────────────────────────────────────────
export function useGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('goals').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAddGoalProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, currentAmount, addAmount, targetAmount }: { id: string; currentAmount: number; addAmount: number; targetAmount: number }) => {
      const newAmount = Math.min(Number(currentAmount) + addAmount, Number(targetAmount));
      const { error } = await supabase.from('goals').update({ current_amount: newAmount }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (goal: { title: string; target_amount: number; deadline: string; color: string }) => {
      const { error } = await supabase.from('goals').insert([{ ...goal, user_id: user!.id }]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

// ─── Groups ──────────────────────────────────────────────────
export function useGroups() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['groups', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('groups').select('*, group_members(*)');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// ─── Insights ────────────────────────────────────────────────
export function useInsights() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['insights', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('insights').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useMarkInsightActioned() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('insights').update({ action_taken: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insights'] }),
  });
}

// ─── Profile ─────────────────────────────────────────────────
export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
