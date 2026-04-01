interface AmountBadgeProps {
  amount: number;
  type: 'income' | 'expense';
  className?: string;
}

export function AmountBadge({ amount, type, className }: AmountBadgeProps) {
  const isIncome = type === 'income';
  return (
    <span className={`font-semibold font-mono text-sm ${isIncome ? 'text-success' : 'text-destructive'} ${className}`}>
      {isIncome ? '+' : '-'} R$ {Math.abs(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    </span>
  );
}
