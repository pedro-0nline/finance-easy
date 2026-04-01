import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GoalRing } from '@/components/GoalRing';
import { useStore } from '@/store/useStore';
import { differenceInDays, parseISO } from 'date-fns';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function GoalsPage() {
  const { goals, addGoalProgress } = useStore();
  const [progressInput, setProgressInput] = useState<Record<string, string>>({});

  const handleAdd = (id: string) => {
    const val = parseFloat(progressInput[id]?.replace(',', '.') || '0');
    if (val <= 0) return;
    addGoalProgress(id, val);
    setProgressInput((p) => ({ ...p, [id]: '' }));
    toast.success('Progresso adicionado!');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Metas Financeiras</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g) => {
          const pct = (g.currentAmount / g.targetAmount) * 100;
          const daysLeft = differenceInDays(parseISO(g.deadline), new Date());
          const remaining = g.targetAmount - g.currentAmount;
          const monthlyNeeded = daysLeft > 0 ? remaining / (daysLeft / 30) : 0;

          return (
            <Card key={g.id} className="animate-fade-in">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <GoalRing progress={pct} color={g.color} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{g.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {fmt(g.currentAmount)} de {fmt(g.targetAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Faltam {fmt(remaining)} em {daysLeft > 0 ? `${daysLeft} dias` : 'prazo vencido'}
                    </p>
                    {daysLeft > 0 && (
                      <p className="text-xs text-info mt-1">
                        Economize {fmt(monthlyNeeded)}/mês para atingir no prazo
                      </p>
                    )}
                    {daysLeft <= 15 && daysLeft > 0 && (
                      <p className="text-xs text-warning mt-1 font-medium">⚠ Prazo próximo!</p>
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
                  <Button size="sm" onClick={() => handleAdd(g.id)}>
                    <Plus size={14} className="mr-1" /> Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* New goal card */}
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
