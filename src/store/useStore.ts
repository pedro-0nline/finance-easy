import { create } from 'zustand';
import type { Transaction, BankAccount, CreditCard, Budget, Goal, Group, Insight } from '@/types';
import { mockTransactions, mockBankAccounts, mockCreditCards, mockBudgets, mockGoals, mockGroup, mockInsights } from '@/data/mock';

interface AppState {
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  creditCards: CreditCard[];
  budgets: Budget[];
  goals: Goal[];
  group: Group | null;
  insights: Insight[];
  theme: 'dark' | 'light';
  addTransaction: (t: Transaction) => void;
  togglePaid: (id: string) => void;
  deleteTransaction: (id: string) => void;
  markInsightActioned: (id: string) => void;
  addGoalProgress: (id: string, amount: number) => void;
  setTheme: (t: 'dark' | 'light') => void;
}

export const useStore = create<AppState>((set) => ({
  transactions: mockTransactions,
  bankAccounts: mockBankAccounts,
  creditCards: mockCreditCards,
  budgets: mockBudgets,
  goals: mockGoals,
  group: mockGroup,
  insights: mockInsights,
  theme: 'dark',
  addTransaction: (t) => set((s) => ({ transactions: [t, ...s.transactions] })),
  togglePaid: (id) => set((s) => ({
    transactions: s.transactions.map((t) => t.id === id ? { ...t, isPaid: !t.isPaid } : t),
  })),
  deleteTransaction: (id) => set((s) => ({
    transactions: s.transactions.filter((t) => t.id !== id),
  })),
  markInsightActioned: (id) => set((s) => ({
    insights: s.insights.map((i) => i.id === id ? { ...i, actionTaken: true } : i),
  })),
  addGoalProgress: (id, amount) => set((s) => ({
    goals: s.goals.map((g) => g.id === id ? { ...g, currentAmount: Math.min(g.currentAmount + amount, g.targetAmount) } : g),
  })),
  setTheme: (theme) => set({ theme }),
}));
