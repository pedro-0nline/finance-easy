import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

const VALID_TRANSACTION_TYPES: Database['public']['Enums']['transaction_type'][] = ['income', 'expense', 'recurring', 'fixed'];
const VALID_PAYMENT_METHODS: Database['public']['Enums']['payment_method'][] = ['cash', 'credit_card', 'debit_card', 'pix', 'transfer', 'boleto'];
const VALID_CATEGORIES: Database['public']['Enums']['category'][] = ['food', 'health', 'transport', 'education', 'leisure', 'housing', 'utilities', 'other'];

// ─── Transactions ────────────────────────────────────────────
export function useTransactions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user!.id)
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
      if (!user?.id) {
        throw new Error('Usuario nao autenticado.');
      }

      const normalizedType: Database['public']['Enums']['transaction_type'] =
        VALID_TRANSACTION_TYPES.includes(t.type as Database['public']['Enums']['transaction_type'])
          ? (t.type as Database['public']['Enums']['transaction_type'])
          : 'expense';

      const normalizedPaymentMethod: Database['public']['Enums']['payment_method'] =
        VALID_PAYMENT_METHODS.includes(t.payment_method as Database['public']['Enums']['payment_method'])
          ? (t.payment_method as Database['public']['Enums']['payment_method'])
          : 'pix';

      const normalizedCategory: Database['public']['Enums']['category'] =
        VALID_CATEGORIES.includes(t.category as Database['public']['Enums']['category'])
          ? (t.category as Database['public']['Enums']['category'])
          : 'other';

      const normalizedAmount = Number(t.amount);
      if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        throw new Error('Valor invalido para a transacao.');
      }

      const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(t.date) ? t.date : new Date().toISOString().slice(0, 10);

      const payload: Database['public']['Tables']['transactions']['Insert'] = {
        user_id: user.id,
        type: normalizedType,
        category: normalizedCategory,
        description: t.description?.trim() || '',
        amount: normalizedAmount,
        payment_method: normalizedPaymentMethod,
        date: normalizedDate,
        is_installment: !!t.is_installment,
        installment_number: t.installment_number ?? null,
        total_installments: t.total_installments ?? null,
        installment_group_id: t.installment_group_id ?? null,
        is_shared: !!t.is_shared,
        shared_with: t.shared_with ?? [],
        is_paid: !!t.is_paid,
        notes: t.notes?.trim() || null,
      };

      const { error } = await supabase.from('transactions').insert([payload]);
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
      const { data, error } = await supabase.from('bank_accounts').select('*').eq('user_id', user!.id);
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
      const { data, error } = await supabase.from('credit_cards').select('*').eq('user_id', user!.id);
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
      const { data, error } = await supabase.from('budgets').select('*').eq('user_id', user!.id);
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
      const { data, error } = await supabase.from('goals').select('*').eq('user_id', user!.id);
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
      const { data, error } = await supabase
        .from('insights')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
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
