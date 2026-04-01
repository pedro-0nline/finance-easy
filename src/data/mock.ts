import type { Transaction, BankAccount, CreditCard, Budget, Goal, Group, Insight } from '@/types';
import { format, subDays, addDays, addMonths } from 'date-fns';

const today = new Date();
const currentMonth = format(today, 'yyyy-MM');
const d = (daysAgo: number) => format(subDays(today, daysAgo), 'yyyy-MM-dd');
const f = (daysAhead: number) => format(addDays(today, daysAhead), 'yyyy-MM-dd');

const installmentGroupId = 'inst-notebook-001';

export const mockTransactions: Transaction[] = [
  // Income
  { id: 't1', userId: 'u1', type: 'income', category: 'other', description: 'Salário', amount: 8500, paymentMethod: 'transfer', date: d(25), isInstallment: false, isShared: false, isPaid: true },
  { id: 't2', userId: 'u1', type: 'income', category: 'other', description: 'Freelance - Design', amount: 2200, paymentMethod: 'pix', date: d(18), isInstallment: false, isShared: false, isPaid: true },
  { id: 't3', userId: 'u1', type: 'income', category: 'other', description: 'Rendimento CDB', amount: 145.80, paymentMethod: 'transfer', date: d(5), isInstallment: false, isShared: false, isPaid: true },
  // Expenses
  { id: 't4', userId: 'u1', type: 'expense', category: 'food', description: 'Supermercado Extra', amount: 487.32, paymentMethod: 'debit_card', date: d(1), isInstallment: false, isShared: false, isPaid: true },
  { id: 't5', userId: 'u1', type: 'expense', category: 'food', description: 'iFood - Jantar', amount: 68.90, paymentMethod: 'credit_card', date: d(2), isInstallment: false, isShared: false, isPaid: true },
  { id: 't6', userId: 'u1', type: 'expense', category: 'food', description: 'Padaria Avenida', amount: 32.50, paymentMethod: 'pix', date: d(3), isInstallment: false, isShared: false, isPaid: true },
  { id: 't7', userId: 'u1', type: 'expense', category: 'food', description: 'Almoço restaurante', amount: 55.00, paymentMethod: 'credit_card', date: d(6), isInstallment: false, isShared: true, sharedWith: [{ userId: 'u2', amount: 27.50 }], isPaid: true },
  { id: 't8', userId: 'u1', type: 'expense', category: 'transport', description: 'Uber - Trabalho', amount: 24.50, paymentMethod: 'credit_card', date: d(1), isInstallment: false, isShared: false, isPaid: true },
  { id: 't9', userId: 'u1', type: 'expense', category: 'transport', description: 'Gasolina', amount: 250.00, paymentMethod: 'debit_card', date: d(8), isInstallment: false, isShared: false, isPaid: true },
  { id: 't10', userId: 'u1', type: 'expense', category: 'health', description: 'Farmácia', amount: 89.90, paymentMethod: 'pix', date: d(4), isInstallment: false, isShared: false, isPaid: true },
  { id: 't11', userId: 'u1', type: 'expense', category: 'health', description: 'Consulta médica', amount: 350.00, paymentMethod: 'credit_card', date: d(12), isInstallment: false, isShared: false, isPaid: true },
  { id: 't12', userId: 'u1', type: 'expense', category: 'leisure', description: 'Cinema + pipoca', amount: 95.00, paymentMethod: 'credit_card', date: d(7), isInstallment: false, isShared: true, sharedWith: [{ userId: 'u2', amount: 47.50 }], isPaid: true },
  { id: 't13', userId: 'u1', type: 'expense', category: 'leisure', description: 'Spotify Premium', amount: 21.90, paymentMethod: 'credit_card', date: d(15), isInstallment: false, isShared: false, isPaid: true },
  { id: 't14', userId: 'u1', type: 'expense', category: 'education', description: 'Curso Udemy', amount: 27.90, paymentMethod: 'credit_card', date: d(10), isInstallment: false, isShared: false, isPaid: true },
  { id: 't15', userId: 'u1', type: 'expense', category: 'utilities', description: 'Conta de Luz', amount: 215.40, paymentMethod: 'boleto', date: d(9), isInstallment: false, isShared: false, isPaid: true },
  { id: 't16', userId: 'u1', type: 'expense', category: 'utilities', description: 'Internet', amount: 129.90, paymentMethod: 'boleto', date: d(11), isInstallment: false, isShared: false, isPaid: true },
  { id: 't17', userId: 'u1', type: 'expense', category: 'utilities', description: 'Conta de Água', amount: 85.00, paymentMethod: 'boleto', date: d(13), isInstallment: false, isShared: false, isPaid: true },
  // Recurring/Fixed
  { id: 't18', userId: 'u1', type: 'fixed', category: 'housing', description: 'Aluguel', amount: 2200, paymentMethod: 'transfer', date: d(20), isInstallment: false, isShared: false, isPaid: true },
  { id: 't19', userId: 'u1', type: 'fixed', category: 'housing', description: 'Condomínio', amount: 650, paymentMethod: 'boleto', date: d(19), isInstallment: false, isShared: false, isPaid: true },
  { id: 't20', userId: 'u1', type: 'recurring', category: 'health', description: 'Academia Smart Fit', amount: 99.90, paymentMethod: 'credit_card', date: d(14), isInstallment: false, isShared: false, isPaid: true },
  // Installments - Notebook 12x R$200
  ...Array.from({ length: 3 }, (_, i) => ({
    id: `t-inst-${i + 1}`,
    userId: 'u1',
    type: 'expense' as const,
    category: 'education' as const,
    description: 'Notebook Dell Inspiron',
    amount: 200,
    paymentMethod: 'credit_card' as const,
    date: format(addMonths(new Date(2025, 0, 15), i), 'yyyy-MM-dd'),
    isInstallment: true,
    installmentNumber: i + 1,
    totalInstallments: 12,
    installmentGroupId,
    isShared: false,
    isPaid: i < 3,
  })),
  // More expenses
  { id: 't24', userId: 'u1', type: 'expense', category: 'food', description: 'Café Starbucks', amount: 28.50, paymentMethod: 'credit_card', date: d(0), isInstallment: false, isShared: false, isPaid: true },
  { id: 't25', userId: 'u1', type: 'expense', category: 'transport', description: '99 - Consulta', amount: 18.70, paymentMethod: 'pix', date: d(4), isInstallment: false, isShared: false, isPaid: true },
  { id: 't26', userId: 'u1', type: 'expense', category: 'leisure', description: 'Livro Amazon', amount: 45.90, paymentMethod: 'credit_card', date: d(6), isInstallment: false, isShared: false, isPaid: true },
  { id: 't27', userId: 'u1', type: 'expense', category: 'food', description: 'Feira orgânica', amount: 120.00, paymentMethod: 'cash', date: d(3), isInstallment: false, isShared: false, isPaid: true },
  { id: 't28', userId: 'u1', type: 'expense', category: 'other', description: 'Presente aniversário', amount: 180.00, paymentMethod: 'pix', date: d(5), isInstallment: false, isShared: false, isPaid: true },
  // Upcoming unpaid
  { id: 't29', userId: 'u1', type: 'expense', category: 'utilities', description: 'Conta de Gás', amount: 65.00, paymentMethod: 'boleto', date: f(3), isInstallment: false, isShared: false, isPaid: false },
  { id: 't30', userId: 'u1', type: 'fixed', category: 'housing', description: 'Aluguel - Próximo mês', amount: 2200, paymentMethod: 'transfer', date: f(10), isInstallment: false, isShared: false, isPaid: false },
  { id: 't31', userId: 'u1', type: 'expense', category: 'education', description: 'Mensalidade curso inglês', amount: 450, paymentMethod: 'boleto', date: f(5), isInstallment: false, isShared: false, isPaid: false },
  { id: 't32', userId: 'u1', type: 'recurring', category: 'health', description: 'Plano de Saúde', amount: 520, paymentMethod: 'boleto', date: f(7), isInstallment: false, isShared: false, isPaid: false },
];

export const mockBankAccounts: BankAccount[] = [
  { id: 'acc1', name: 'Conta Corrente', type: 'checking', balance: 4235.67, institution: 'Nubank', color: '#8B5CF6' },
  { id: 'acc2', name: 'Poupança', type: 'savings', balance: 12580.00, institution: 'Itaú', color: '#F97316' },
];

export const mockCreditCards: CreditCard[] = [
  { id: 'cc1', name: 'Nubank Ultravioleta', limit: 8000, used: 5840, dueDay: 15, closingDay: 8, institution: 'Nubank', color: '#7C3AED' },
];

export const mockBudgets: Budget[] = [
  { id: 'b1', category: 'food', limit: 800, spent: 792.22, month: currentMonth },
  { id: 'b2', category: 'health', limit: 600, spent: 539.90, month: currentMonth },
  { id: 'b3', category: 'transport', limit: 400, spent: 293.20, month: currentMonth },
  { id: 'b4', category: 'education', limit: 500, spent: 677.90, month: currentMonth },
  { id: 'b5', category: 'leisure', limit: 300, spent: 162.80, month: currentMonth },
  { id: 'b6', category: 'housing', limit: 3000, spent: 2850, month: currentMonth },
  { id: 'b7', category: 'utilities', limit: 500, spent: 430.30, month: currentMonth },
  { id: 'b8', category: 'other', limit: 400, spent: 180.00, month: currentMonth },
];

export const mockGoals: Goal[] = [
  { id: 'g1', title: 'Reserva de Emergência', targetAmount: 25000, currentAmount: 18500, deadline: f(90), color: '#22C55E' },
  { id: 'g2', title: 'Viagem para Europa', targetAmount: 15000, currentAmount: 3200, deadline: f(15), color: '#3B82F6' },
];

export const mockGroup: Group = {
  id: 'grp1',
  name: 'Família Silva',
  ownerId: 'u1',
  inviteCode: 'FAM-ABC123XY',
  members: [
    { userId: 'u1', name: 'João Silva', role: 'owner', avatar: undefined },
    { userId: 'u2', name: 'Maria Silva', role: 'manager', avatar: undefined },
    { userId: 'u3', name: 'Pedro Silva', role: 'viewer', avatar: undefined },
  ],
};

export const mockInsights: Insight[] = [
  { id: 'i1', type: 'alert', title: 'Orçamento de Alimentação quase esgotado', description: 'Você já usou 99% do orçamento de Alimentação este mês. Considere reduzir gastos nesta categoria.', createdAt: d(0), actionTaken: false, priority: 'high' },
  { id: 'i2', type: 'alert', title: 'Cartão de crédito próximo do limite', description: 'Seu cartão Nubank está com 73% do limite utilizado. Evite novas compras parceladas.', createdAt: d(1), actionTaken: false, priority: 'high' },
  { id: 'i3', type: 'recommendation', title: 'Reduza gastos com delivery', description: 'Você gastou R$280 com iFood este mês. Cozinhar em casa pode economizar até R$200/mês.', createdAt: d(2), actionTaken: false, priority: 'medium' },
  { id: 'i4', type: 'recommendation', title: 'Aumente sua reserva de emergência', description: 'Com base no seu padrão de gastos, recomendamos uma reserva de R$25.000. Você está em 74%.', createdAt: d(3), actionTaken: true, priority: 'medium' },
  { id: 'i5', type: 'analysis', title: 'Seus gastos caíram 12% vs mês passado', description: 'Parabéns! Suas despesas reduziram comparado ao mês anterior. Principais economias: Transporte (-18%) e Lazer (-25%).', createdAt: d(1), actionTaken: false, priority: 'low' },
];

// Weekly data for charts
export const weeklyData = Array.from({ length: 8 }, (_, i) => {
  const weekStart = subDays(today, (7 - i) * 7);
  return {
    week: format(weekStart, 'dd/MM'),
    entradas: [2800, 3100, 2400, 3500, 2900, 3200, 2600, 3800][i],
    saidas: [2200, 2800, 2600, 2900, 2400, 2700, 2300, 3100][i],
  };
});
