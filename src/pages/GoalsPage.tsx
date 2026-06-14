import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoalRing } from '@/components/GoalRing';
import { useGoals, useAddGoalProgress, useCreateGoal } from '@/hooks/useSupabaseData';
import { differenceInDays, parseISO } from 'date-fns';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals();
  const addProgress = useAddGoalProgress();
  const createGoal = useCreateGoal();
  const [progressInput, setProgressInput] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', target_amount: '', deadline: '', color: COLORS[0] });

  const handleAdd = (id: string, currentAmount: number, targetAmount: number) => {
    const val = parseFloat(progressInput[id]?.replace(',', '.') || '0');
    if (val <= 0) return;
    addProgress.mutate(
      { id, currentAmount, addAmount: val, targetAmount },
      { onSuccess: () => { setProgressInput((p) => ({ ...p, [id]: '' })); toast.success('Progresso adicionado!'); } }
    );
  };

  const handleCreate = () => {
    if (!form.title.trim()) { toast.error('Informe o nome da meta'); return; }
    const amount = parseFloat(form.target_amount.replace(',', '.'));
    if (!amount || amount <= 0) { toast.error('Informe um valor válido'); return; }
    if (!form.deadline) { toast.error('Informe o prazo'); return; }
    createGoal.mutate(
      { title: form.title, target_amount: amount, deadline: form.deadline, color: form.color },
      {
        onSuccess: () => {
          toast.success('Meta criada!');
          setForm({ title: '', target_amount: '', deadline: '', color: COLORS[0] });
          setOpen(false);
        },
      }
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Metas Financeiras</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus size={16} className="mr-1" /> Nova Meta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Meta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da meta</Label>
                <Input placeholder="Ex: Viagem, Reserva de emergência" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Valor alvo (R$)</Label>
                <Input placeholder="10000" inputMode="decimal" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} />
              </div>
              <div>
                <Label>Prazo</Label>
                <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </div>
              <div>
                <Label>Cor</Label>
                <div className="flex gap-2 mt-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${form.color === c ? 'scale-110 border-foreground' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={createGoal.isPending}>
                {createGoal.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
                Criar Meta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
                      <p className="text-xs text-muted-foreground mt-1">
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

        {goals.length === 0 && (
          <Card className="border-dashed animate-fade-in flex items-center justify-center min-h-[200px]">
            <CardContent className="text-center text-muted-foreground p-5">
              <Plus size={32} className="mx-auto mb-2" />
              <p className="font-medium">Crie sua primeira meta usando o botão acima</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
