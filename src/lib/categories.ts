import type { Category, CategoryConfig } from '@/types';

export const categoryConfig: Record<Category, CategoryConfig> = {
  food:      { icon: 'UtensilsCrossed', color: '#E85D30', label: 'Alimentação' },
  health:    { icon: 'Heart',           color: '#E84D6B', label: 'Saúde' },
  transport: { icon: 'Car',             color: '#22C55E', label: 'Transporte' },
  education: { icon: 'GraduationCap',   color: '#3B82F6', label: 'Educação' },
  leisure:   { icon: 'Gamepad2',        color: '#A855F7', label: 'Lazer' },
  housing:   { icon: 'Home',            color: '#6B7280', label: 'Moradia' },
  utilities: { icon: 'Zap',             color: '#EAB308', label: 'Utilidades' },
  other:     { icon: 'MoreHorizontal',  color: '#94A3B8', label: 'Outros' },
};

export const paymentMethodLabels: Record<string, string> = {
  cash: 'Dinheiro',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  transfer: 'Transferência',
  boleto: 'Boleto',
};

export const transactionTypeLabels: Record<string, string> = {
  income: 'Entrada',
  expense: 'Saída',
  recurring: 'Recorrente',
  fixed: 'Fixo',
};
