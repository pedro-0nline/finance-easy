import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/CategoryIcon';
import { AmountBadge } from '@/components/AmountBadge';
import { useTransactions } from '@/hooks/useSupabaseData';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Category } from '@/types';

export default function CalendarPage() {
  const { data: transactions = [], isLoading } = useTransactions();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });
  const startPad = getDay(start);

  const txnsByDay = useMemo(() => {
    const map = new Map<string, typeof transactions>();
    transactions.forEach((t) => {
      const key = t.date.split('T')[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return map;
  }, [transactions]);

  const selectedTxns = selectedDay ? txnsByDay.get(format(selectedDay, 'yyyy-MM-dd')) || [] : [];

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendário</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft size={18} /></Button>
          <span className="font-medium capitalize min-w-[140px] text-center">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight size={18} /></Button>
        </div>
      </div>

      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-success" /> Entrada</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-destructive" /> Saída</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-warning" /> Vencimento</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> Parcela</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <div key={d} className="text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
              {days.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const dayTxns = txnsByDay.get(key) || [];
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const hasIncome = dayTxns.some((t) => t.type === 'income');
                const hasExpense = dayTxns.some((t) => t.type !== 'income');
                const hasInstallment = dayTxns.some((t) => t.is_installment);

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(day)}
                    className={`p-1.5 rounded-lg text-sm transition-colors min-h-[48px] flex flex-col items-center gap-0.5
                      ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}
                    `}
                  >
                    <span>{format(day, 'd')}</span>
                    <div className="flex gap-0.5">
                      {hasIncome && <div className="w-1.5 h-1.5 rounded-full bg-success" />}
                      {hasExpense && <div className="w-1.5 h-1.5 rounded-full bg-destructive" />}
                      {hasInstallment && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">
              {selectedDay ? format(selectedDay, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
            </h3>
            {selectedTxns.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma transação neste dia</p>}
            <div className="space-y-2">
              {selectedTxns.map((t) => (
                <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-accent/50">
                  <CategoryIcon category={t.category as Category} size={12} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{t.description}</p>
                  </div>
                  <AmountBadge amount={Number(t.amount)} type={t.type === 'income' ? 'income' : 'expense'} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
