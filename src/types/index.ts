export type TransactionType = 'income' | 'expense' | 'recurring' | 'fixed';
export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'transfer' | 'boleto';
export type Category = 'food' | 'health' | 'transport' | 'education' | 'leisure' | 'housing' | 'utilities' | 'other';
export type GroupRole = 'owner' | 'manager' | 'editor' | 'viewer';
export type InsightType = 'analysis' | 'recommendation' | 'alert' | 'opportunity';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  category: Category;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  isInstallment: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  installmentGroupId?: string;
  isShared: boolean;
  sharedWith?: { userId: string; amount: number }[];
  googleCalendarEventId?: string;
  isPaid: boolean;
  notes?: string;
}

export interface BankAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'investment';
  balance: number;
  institution: string;
  color: string;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  used: number;
  dueDay: number;
  closingDay: number;
  institution: string;
  color: string;
}

export interface Budget {
  id: string;
  category: Category;
  limit: number;
  spent: number;
  month: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
}

export interface Group {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  members: { userId: string; name: string; role: GroupRole; avatar?: string }[];
}

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  createdAt: string;
  actionTaken: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface CategoryConfig {
  icon: string;
  color: string;
  label: string;
}
