import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendIndicator } from '@/components/TrendIndicator';

interface KPICardProps {
  title: string;
  value: string;
  trend: number;
  icon: LucideIcon;
  iconColor: string;
}

export function KPICard({ title, value, trend, icon: Icon, iconColor }: KPICardProps) {
  return (
    <Card className="animate-fade-in">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          </div>
          <div className="rounded-lg p-2" style={{ backgroundColor: iconColor + '15', color: iconColor }}>
            <Icon size={20} />
          </div>
        </div>
        <div className="mt-3">
          <TrendIndicator value={trend} />
          <span className="text-xs text-muted-foreground ml-1">vs mês anterior</span>
        </div>
      </CardContent>
    </Card>
  );
}
