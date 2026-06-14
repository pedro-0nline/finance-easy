import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type GroupMember = {
  id: string;
  user_id: string;
  name: string;
  role: string;
};

type CoupleGroup = {
  id: string;
  name: string;
  kind: 'general' | 'couple';
};

type SharedExpenseParticipantInput = {
  user_id: string;
  should_pay: number;
  paid_amount: number;
  note?: string;
};

export function useCoupleGroup() {
  const { user } = useAuth();
  const db = supabase as any;

  return useQuery({
    queryKey: ['couple_group', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<CoupleGroup | null> => {
      const { data, error } = await db
        .from('group_members')
        .select('group_id, groups!inner(id,name,kind)')
        .eq('user_id', user!.id)
        .eq('groups.kind', 'couple')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data?.groups) return null;
      const group = Array.isArray(data.groups) ? data.groups[0] : data.groups;
      return group as CoupleGroup;
    },
  });
}

export function useGroupMembers(groupId?: string | null) {
  const db = supabase as any;
  return useQuery({
    queryKey: ['group_members', groupId],
    enabled: !!groupId,
    queryFn: async (): Promise<GroupMember[]> => {
      const { data, error } = await db
        .from('group_members')
        .select('id,user_id,name,role')
        .eq('group_id', groupId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as GroupMember[];
    },
  });
}

export function useCoupleOverview(groupId?: string | null) {
  const db = supabase as any;
  const { data: members = [] } = useGroupMembers(groupId);

  return useQuery({
    queryKey: ['couple_overview', groupId, members.map((m) => m.user_id).join(',')],
    enabled: !!groupId && members.length > 0,
    queryFn: async () => {
      const userIds = members.map((m) => m.user_id);
      const monthPrefix = new Date().toISOString().slice(0, 7);

      const [{ data: txs, error: txErr }, { data: accounts, error: accErr }] = await Promise.all([
        db.from('transactions').select('user_id,type,amount,date').in('user_id', userIds),
        db.from('bank_accounts').select('user_id,balance').in('user_id', userIds),
      ]);

      if (txErr) throw txErr;
      if (accErr) throw accErr;

      const monthTxs = (txs || []).filter((t: any) => t.date.startsWith(monthPrefix));
      const byUser: Record<string, { income: number; expenses: number; net: number; balance: number; name: string }> = {};

      for (const member of members) {
        byUser[member.user_id] = { income: 0, expenses: 0, net: 0, balance: 0, name: member.name };
      }

      for (const t of monthTxs as any[]) {
        const entry = byUser[t.user_id];
        if (!entry) continue;
        const amount = Number(t.amount) || 0;
        if (t.type === 'income') entry.income += amount;
        else entry.expenses += amount;
      }

      for (const a of (accounts || []) as any[]) {
        const entry = byUser[a.user_id];
        if (!entry) continue;
        entry.balance += Number(a.balance) || 0;
      }

      Object.values(byUser).forEach((entry) => {
        entry.net = entry.income - entry.expenses;
      });

      const combined = Object.values(byUser).reduce(
        (acc, cur) => ({
          income: acc.income + cur.income,
          expenses: acc.expenses + cur.expenses,
          net: acc.net + cur.net,
          balance: acc.balance + cur.balance,
        }),
        { income: 0, expenses: 0, net: 0, balance: 0 }
      );

      return { byUser, combined, memberIds: userIds };
    },
  });
}

export function useSharedExpenses(groupId?: string | null) {
  const db = supabase as any;
  return useQuery({
    queryKey: ['shared_expenses', groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await db
        .from('shared_expenses')
        .select('*, shared_expense_participants(*)')
        .eq('group_id', groupId!)
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateSharedExpense() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const db = supabase as any;

  return useMutation({
    mutationFn: async (payload: {
      group_id: string;
      title: string;
      description?: string;
      category?: string;
      payment_method?: string;
      total_amount: number;
      expense_date: string;
      split_method?: 'equal' | 'custom';
      participants: SharedExpenseParticipantInput[];
    }) => {
      if (!user?.id) throw new Error('Usuario nao autenticado.');
      if (!payload.participants.length) throw new Error('Adicione pelo menos um participante.');

      const { data: expense, error: expenseErr } = await db
        .from('shared_expenses')
        .insert([
          {
            group_id: payload.group_id,
            created_by: user.id,
            title: payload.title.trim(),
            description: payload.description?.trim() || '',
            category: (payload.category || 'other') as any,
            payment_method: (payload.payment_method || 'pix') as any,
            total_amount: payload.total_amount,
            expense_date: payload.expense_date,
            split_method: payload.split_method || 'equal',
          },
        ])
        .select('id')
        .single();

      if (expenseErr) throw expenseErr;

      const participantRows = payload.participants.map((p) => ({
        expense_id: expense.id,
        user_id: p.user_id,
        should_pay: p.should_pay,
        paid_amount: p.paid_amount,
        note: p.note || '',
      }));

      const { error: participantErr } = await db.from('shared_expense_participants').insert(participantRows);
      if (participantErr) throw participantErr;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['shared_expenses', variables.group_id] });
    },
  });
}

export function useUpdateSharedParticipantPaid() {
  const qc = useQueryClient();
  const db = supabase as any;

  return useMutation({
    mutationFn: async (payload: { participant_id: string; paid_amount: number; group_id: string }) => {
      const { error } = await db
        .from('shared_expense_participants')
        .update({ paid_amount: payload.paid_amount })
        .eq('id', payload.participant_id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['shared_expenses', variables.group_id] });
    },
  });
}

export function useSharedExpenseSettlements(groupId?: string | null) {
  const { data: expenses = [] } = useSharedExpenses(groupId);

  return useMemo(() => {
    const balances: Record<string, number> = {};
    const names: Record<string, string> = {};

    for (const expense of expenses as any[]) {
      for (const p of expense.shared_expense_participants || []) {
        const delta = Number(p.paid_amount || 0) - Number(p.should_pay || 0);
        balances[p.user_id] = (balances[p.user_id] || 0) + delta;
        if (!names[p.user_id]) names[p.user_id] = p.user_id;
      }
    }

    const creditors = Object.entries(balances)
      .filter(([, v]) => v > 0.009)
      .map(([user_id, amount]) => ({ user_id, amount }));
    const debtors = Object.entries(balances)
      .filter(([, v]) => v < -0.009)
      .map(([user_id, amount]) => ({ user_id, amount: Math.abs(amount) }));

    const settlements: Array<{ from_user_id: string; to_user_id: string; amount: number }> = [];

    let i = 0;
    let j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(debtor.amount, creditor.amount);
      settlements.push({
        from_user_id: debtor.user_id,
        to_user_id: creditor.user_id,
        amount,
      });
      debtor.amount -= amount;
      creditor.amount -= amount;
      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return { balances, settlements, names };
  }, [expenses]);
}
