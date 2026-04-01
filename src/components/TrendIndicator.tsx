import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function TrendIndicator({ value }: { value: number }) {
  if (value === 0) return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Minus size={12} /> 0%</span>;
  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
      <Icon size={12} />
      {isPositive ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}
