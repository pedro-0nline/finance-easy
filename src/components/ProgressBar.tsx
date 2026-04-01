interface ProgressBarProps {
  value: number;
  max: number;
  showAlert?: boolean;
  className?: string;
}

export function ProgressBar({ value, max, showAlert, className }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct > 90 ? 'bg-destructive' : pct > 70 ? 'bg-warning' : 'bg-success';
  return (
    <div className={`w-full ${className}`}>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {showAlert && pct > 90 && (
        <p className="text-xs text-destructive mt-1">⚠ Orçamento quase esgotado!</p>
      )}
    </div>
  );
}
