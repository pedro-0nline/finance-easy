import { Badge } from '@/components/ui/badge';
import { transactionTypeLabels, paymentMethodLabels } from '@/lib/categories';
import type { TransactionType, PaymentMethod } from '@/types';

export function TransactionTypeBadge({ type }: { type: TransactionType }) {
  const variants: Record<TransactionType, string> = {
    income: 'bg-success/10 text-success border-success/20',
    expense: 'bg-destructive/10 text-destructive border-destructive/20',
    recurring: 'bg-info/10 text-info border-info/20',
    fixed: 'bg-warning/10 text-warning border-warning/20',
  };
  return <Badge variant="outline" className={variants[type]}>{transactionTypeLabels[type]}</Badge>;
}

export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  return <Badge variant="secondary" className="text-xs font-normal">{paymentMethodLabels[method]}</Badge>;
}

export function InstallmentBadge({ current, total }: { current: number; total: number }) {
  return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">{current}/{total}x</Badge>;
}
