import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GoalRing } from '@/components/GoalRing';
import { useGoals, useAddGoalProgress } from '@/hooks/useSupabaseData';
import { differenceInDays, parseISO } from 'date-fns';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals();
  const addProgress = useAddGoalProgress();
  const [progressInput, setProgressInput] = useState<Record<string, string>>({});

  const handleAdd = (id: string, currentAmount: number, targetAmount: number) => {
    const val = parseFloat(progressInput[id]?.replace(',', '.') || '0');
    if (val <= 0) return;
    addProgress.mutate(
      { id, currentAmount, addAmount: val, targetAmount },
      { onSuccess: () => { setProgressInput((p) => ({ ...p, [id]: '' })); toast.success('Progresso adicionado!'); } }
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Metas Financeiras</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g) => {
          const pct = (Number(g.current_amount) / Number(g.target_amount)) * 100;
          const daysLeft = differenceInDays(parseISO(g.deadline), new Date());
          const remaining = Number(g.target_amount) - Number(g.current_amount);
          const monthlyNeeded = daysLeft > 0 ? remaining / (daysLeft / 30) : 0;

          return (
            <Card key={g.id} className="animate-fade-in">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <GoalRing progress={pct} color={g.color} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{g.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {fmt(Number(g.current_amount))} de {fmt(Number(g.target_amount))}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Faltam {fmt(remaining)} em {daysLeft > 0 ? `${daysLeft} dias` : 'prazo vencido'}
                    </p>
                    {daysLeft > 0 && (
                      <p className="text-xs text-info mt-1">
                        Economize {fmt(monthlyNeeded)}/mês para atingir no prazo
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="R$ valor"
                    value={progressInput[g.id] || ''}
                    onChange={(e) => setProgressInput((p) => ({ ...p, [g.id]: e.target.value }))}
                    className="flex-1"
                    inputMode="decimal"
                  />
                  <Button size="sm" onClick={() => handleAdd(g.id, Number(g.current_amount), Number(g.target_amount))}>
                    <Plus size={14} className="mr-1" /> Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        <Card className="border-dashed animate-fade-in flex items-center justify-center min-h-[200px] cursor-pointer hover:bg-accent/50 transition-colors">
          <CardContent className="text-center text-muted-foreground p-5">
            <Plus size={32} className="mx-auto mb-2" />
            <p className="font-medium">Nova Meta</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
