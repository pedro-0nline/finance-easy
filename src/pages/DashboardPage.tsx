import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, DollarSign, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KPICard } from '@/components/KPICard';
import { CategoryIcon } from '@/components/CategoryIcon';
import { AmountBadge } from '@/components/AmountBadge';
import { InstallmentBadge } from '@/components/Badges';
import { ProgressBar } from '@/components/ProgressBar';
import { useTransactions, useBankAccounts, useCreditCards, useBudgets } from '@/hooks/useSupabaseData';
import { categoryConfig } from '@/lib/categories';
import { format, parseISO, isAfter, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Category } from '@/types';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function DashboardPage() {
  const { data: transactions = [], isLoading: tLoading } = useTransactions();
  const { data: bankAccounts = [], isLoading: bLoading } = useBankAccounts();
  const { data: creditCards = [] } = useCreditCards();
  const { data: budgets = [] } = useBudgets();

  const totalBalance = bankAccounts.reduce((s, a) => s + Number(a.balance), 0);
  const now = new Date();
  const currentMonth = format(now, 'yyyy-MM');

  const monthTxns = transactions.filter((t) => t.date.startsWith(currentMonth));
  const income = monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expenses = monthTxns.filter((t) => t.type !== 'income').reduce((s, t) => s + Number(t.amount), 0);
  const net = income - expenses;

  const upcoming = transactions
    .filter((t) => !t.is_paid && isAfter(parseISO(t.date), now))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  const weeklyData = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const weekStart = startOfWeek(subWeeks(now, 7 - i));
      const weekEnd = endOfWeek(subWeeks(now, 7 - i));
      const weekTxns = transactions.filter((t) => {
        const d = parseISO(t.date);
        return d >= weekStart && d <= weekEnd;
      });
      return {
        week: format(weekStart, 'dd/MM'),
        entradas: weekTxns.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
        saidas: weekTxns.filter((t) => t.type !== 'income').reduce((s, t) => s + Number(t.amount), 0),
      };
    });
  }, [transactions]);

  const categorySpending = useMemo(() => {
    const map: Record<string, number> = {};
    monthTxns.filter((t) => t.type !== 'income').forEach((t) => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });
    return Object.entries(map).map(([cat, value]) => ({
      name: categoryConfig[cat as Category]?.label ?? cat,
      value,
      color: categoryConfig[cat as Category]?.color ?? '#94A3B8',
    }));
  }, [monthTxns]);

  const alerts = [
    ...budgets.filter((b) => Number(b.spent) / Number(b.budget_limit) > 0.9).map((b) => ({
      id: b.id,
      text: `Orçamento de ${categoryConfig[b.category as Category]?.label} em ${Math.round((Number(b.spent) / Number(b.budget_limit)) * 100)}%`,
      type: 'budget' as const,
    })),
    ...creditCards.filter((c) => Number(c.used) / Number(c.credit_limit) > 0.7).map((c) => ({
      id: c.id,
      text: `${c.name} em ${Math.round((Number(c.used) / Number(c.credit_limit)) * 100)}% do limite`,
      type: 'card' as const,
    })),
  ];

  if (tLoading || bLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Saldo Total" value={fmt(totalBalance)} trend={5.2} icon={Wallet} iconColor="#6366F1" />
        <KPICard title="Entradas" value={fmt(income)} trend={12.5} icon={TrendingUp} iconColor="#22C55E" />
        <KPICard title="Saídas" value={fmt(expenses)} trend={-3.8} icon={TrendingDown} iconColor="#EF4444" />
        <KPICard title="Saldo Líquido" value={fmt(net)} trend={net > 0 ? 8.1 : -8.1} icon={DollarSign} iconColor={net >= 0 ? '#22C55E' : '#EF4444'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 animate-fade-in">
          <CardHeader><CardTitle className="text-base">Entradas vs Saídas (8 semanas)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Area type="monotone" dataKey="entradas" stroke="#22C55E" fill="#22C55E" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="saidas" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 animate-fade-in">
          <CardHeader><CardTitle className="text-base">Gastos por Categoria</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={categorySpending} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {categorySpending.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {categorySpending.map((c) => (
                <div key={c.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-muted-foreground truncate">{c.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="animate-fade-in">
          <CardHeader><CardTitle className="text-base">Próximos Vencimentos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground">Nenhum vencimento próximo</p>}
            {upcoming.map((t) => (
              <div key={t.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CategoryIcon category={t.category as Category} size={14} />
                  <div>
                    <p className="text-sm font-medium">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{format(parseISO(t.date), "dd 'de' MMM", { locale: ptBR })}</p>
                  </div>
                </div>
                <AmountBadge amount={Number(t.amount)} type="expense" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader><CardTitle className="text-base">Alertas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {alerts.length === 0 && <p className="text-sm text-muted-foreground">Sem alertas no momento</p>}
            {alerts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <AlertTriangle size={16} className="text-destructive shrink-0" />
                <p className="text-sm">{a.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="animate-fade-in">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Transações Recentes</CardTitle>
          <Link to="/transactions">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              Ver todas <ArrowRight size={14} />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <CategoryIcon category={t.category as Category} size={14} />
                  <div>
                    <p className="text-sm font-medium">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{format(parseISO(t.date), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {t.is_installment && <InstallmentBadge current={t.installment_number!} total={t.total_installments!} />}
                  <AmountBadge amount={Number(t.amount)} type={t.type === 'income' ? 'income' : 'expense'} />
                </div>
              </div>
            ))}
            {recent.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma transação ainda</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
