import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ProgressBar } from '@/components/ProgressBar';
import { useStore } from '@/store/useStore';
import { categoryConfig } from '@/lib/categories';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function BudgetPage() {
  const { budgets } = useStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const monthStr = format(selectedMonth, 'yyyy-MM');
  const monthBudgets = budgets.filter((b) => b.month === monthStr);
  const totalLimit = monthBudgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = monthBudgets.reduce((s, b) => s + b.spent, 0);

  const chartData = Array.from({ length: 6 }, (_, i) => {
    const m = subMonths(selectedMonth, 5 - i);
    return {
      month: format(m, 'MMM', { locale: ptBR }),
      orçado: totalLimit + (i - 3) * 200,
      gasto: totalSpent + (i - 3) * 150 + Math.random() * 500,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orçamento</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}>
            <ChevronLeft size={18} />
          </Button>
          <span className="font-medium capitalize">{format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}</span>
          <Button variant="ghost" size="icon" onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader><CardTitle className="text-base">Resumo Geral</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Total gasto: <strong>{fmt(totalSpent)}</strong></span>
            <span>Orçado: <strong>{fmt(totalLimit)}</strong></span>
          </div>
          <ProgressBar value={totalSpent} max={totalLimit} showAlert />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="orçado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.3} />
              <Bar dataKey="gasto" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Per category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {monthBudgets.map((b) => {
          const pct = Math.round((b.spent / b.limit) * 100);
          return (
            <Card key={b.id} className="animate-fade-in">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <CategoryIcon category={b.category} size={16} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{categoryConfig[b.category].label}</p>
                    <p className="text-xs text-muted-foreground">{fmt(b.spent)} de {fmt(b.limit)}</p>
                  </div>
                  <span className={`text-sm font-bold ${pct > 90 ? 'text-destructive' : pct > 70 ? 'text-warning' : 'text-success'}`}>
                    {pct}%
                  </span>
                </div>
                <ProgressBar value={b.spent} max={b.limit} showAlert />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
