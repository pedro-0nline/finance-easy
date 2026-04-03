import { Card, CardContent } from '@/components/ui/card';
import { useBankAccounts, useCreditCards } from '@/hooks/useSupabaseData';
import { ProgressBar } from '@/components/ProgressBar';
import { CreditCard as CreditCardIcon, Building2, Loader2 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const sparklineData = Array.from({ length: 7 }, (_, i) => ({ v: 3000 + Math.random() * 2000 - 1000 * Math.sin(i) }));

export default function AccountsPage() {
  const { data: bankAccounts = [], isLoading: bLoading } = useBankAccounts();
  const { data: creditCards = [], isLoading: cLoading } = useCreditCards();

  if (bLoading || cLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Contas e Cartões</h1>

      <div>
        <h2 className="text-lg font-semibold mb-3">Contas Bancárias</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bankAccounts.map((acc) => (
            <Card key={acc.id} className="animate-fade-in">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: acc.color + '20', color: acc.color }}>
                      <Building2 size={20} />
                    </div>
                    <div>
                      <p className="font-medium">{acc.name}</p>
                      <p className="text-xs text-muted-foreground">{acc.institution} · {{ checking: 'Corrente', savings: 'Poupança', investment: 'Investimento' }[acc.type]}</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold">{fmt(Number(acc.balance))}</p>
                </div>
                <div className="mt-3 h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklineData}>
                      <Line type="monotone" dataKey="v" stroke={acc.color} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
          {bankAccounts.length === 0 && <p className="text-muted-foreground">Nenhuma conta cadastrada</p>}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Cartões de Crédito</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {creditCards.map((cc) => {
            const pct = Math.round((Number(cc.used) / Number(cc.credit_limit)) * 100);
            return (
              <Card key={cc.id} className="animate-fade-in overflow-hidden">
                <div className="p-5 text-primary-foreground relative" style={{ background: `linear-gradient(135deg, ${cc.color}, ${cc.color}dd)` }}>
                  <CreditCardIcon size={24} className="mb-4 opacity-80" />
                  <p className="font-bold text-lg">{cc.name}</p>
                  <p className="text-sm opacity-80">{cc.institution}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span>Vencimento: dia {cc.due_day}</span>
                    <span>Fecha: dia {cc.closing_day}</span>
                  </div>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Utilizado: {fmt(Number(cc.used))}</span>
                    <span>Limite: {fmt(Number(cc.credit_limit))}</span>
                  </div>
                  <ProgressBar value={Number(cc.used)} max={Number(cc.credit_limit)} showAlert />
                  <p className="text-xs text-muted-foreground">{pct}% do limite utilizado</p>
                  {pct > 80 && <p className="text-xs text-destructive font-medium">⚠ Cartão próximo do limite!</p>}
                </CardContent>
              </Card>
            );
          })}
          {creditCards.length === 0 && <p className="text-muted-foreground">Nenhum cartão cadastrado</p>}
        </div>
      </div>
    </div>
  );
}
