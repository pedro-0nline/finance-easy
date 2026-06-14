import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAddTransaction, useBankAccounts, useCreditCards } from '@/hooks/useSupabaseData';
import { ProgressBar } from '@/components/ProgressBar';
import { CreditCard as CreditCardIcon, Building2, Loader2, Plus, Trash2 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const sparklineData = Array.from({ length: 7 }, (_, i) => ({ v: 3000 + Math.random() * 2000 - 1000 * Math.sin(i) }));

const COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];

export default function AccountsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: bankAccounts = [], isLoading: bLoading } = useBankAccounts();
  const { data: creditCards = [], isLoading: cLoading } = useCreditCards();
  const addTransaction = useAddTransaction();

  const [accOpen, setAccOpen] = useState(false);
  const [ccOpen, setCcOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payOpenCardId, setPayOpenCardId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [payFromAccountId, setPayFromAccountId] = useState<string>('none');
  const [paying, setPaying] = useState(false);
  const [adjustOpenCardId, setAdjustOpenCardId] = useState<string | null>(null);
  const [adjustUsed, setAdjustUsed] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Bank account form
  const [accName, setAccName] = useState('');
  const [accInst, setAccInst] = useState('');
  const [accType, setAccType] = useState<'checking' | 'savings' | 'investment'>('checking');
  const [accBalance, setAccBalance] = useState('');
  const [accColor, setAccColor] = useState(COLORS[0]);

  // Credit card form
  const [ccName, setCcName] = useState('');
  const [ccInst, setCcInst] = useState('');
  const [ccLimit, setCcLimit] = useState('');
  const [ccDue, setCcDue] = useState('10');
  const [ccClosing, setCcClosing] = useState('3');
  const [ccColor, setCcColor] = useState(COLORS[0]);

  const resetAccForm = () => { setAccName(''); setAccInst(''); setAccType('checking'); setAccBalance(''); setAccColor(COLORS[0]); };
  const resetCcForm = () => { setCcName(''); setCcInst(''); setCcLimit(''); setCcDue('10'); setCcClosing('3'); setCcColor(COLORS[0]); };
  const resetPayForm = () => {
    setPayAmount('');
    setPayDate(format(new Date(), 'yyyy-MM-dd'));
    setPayFromAccountId('none');
  };
  const resetAdjustForm = () => {
    setAdjustUsed('');
  };

  const addAccount = async () => {
    if (!accName || !user) return;
    setSaving(true);
    const { error } = await supabase.from('bank_accounts').insert([{
      user_id: user.id, name: accName, institution: accInst, type: accType,
      balance: parseFloat(accBalance) || 0, color: accColor,
    }]);
    setSaving(false);
    if (error) { toast.error('Erro ao criar conta'); return; }
    toast.success('Conta criada!');
    qc.invalidateQueries({ queryKey: ['bank_accounts'] });
    resetAccForm();
    setAccOpen(false);
  };

  const addCard = async () => {
    if (!ccName || !user) return;
    setSaving(true);
    const { error } = await supabase.from('credit_cards').insert([{
      user_id: user.id, name: ccName, institution: ccInst,
      credit_limit: parseFloat(ccLimit) || 0, due_day: parseInt(ccDue) || 10,
      closing_day: parseInt(ccClosing) || 3, color: ccColor,
    }]);
    setSaving(false);
    if (error) { toast.error('Erro ao criar cartão'); return; }
    toast.success('Cartão criado!');
    qc.invalidateQueries({ queryKey: ['credit_cards'] });
    resetCcForm();
    setCcOpen(false);
  };

  const deleteAccount = async (id: string) => {
    const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir conta'); return; }
    toast.success('Conta excluída');
    qc.invalidateQueries({ queryKey: ['bank_accounts'] });
  };

  const deleteCard = async (id: string) => {
    const { error } = await supabase.from('credit_cards').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir cartão'); return; }
    toast.success('Cartão excluído');
    qc.invalidateQueries({ queryKey: ['credit_cards'] });
  };

  const selectedPayCard = creditCards.find((cc) => cc.id === payOpenCardId) || null;
  const selectedAdjustCard = creditCards.find((cc) => cc.id === adjustOpenCardId) || null;

  const payCardInvoice = async () => {
    if (!user?.id || !selectedPayCard) return;

    const parsedAmount = Number.parseFloat(payAmount.replace(',', '.'));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error('Informe um valor válido para pagamento.');
      return;
    }

    const paymentDate = /^\d{4}-\d{2}-\d{2}$/.test(payDate) ? payDate : format(new Date(), 'yyyy-MM-dd');
    const sourceAccount = bankAccounts.find((a) => a.id === payFromAccountId);
    const notes = sourceAccount
      ? `Pagamento de fatura a partir da conta ${sourceAccount.name}.`
      : 'Pagamento de fatura sem conta de origem informada.';

    setPaying(true);
    try {
      await addTransaction.mutateAsync({
        type: 'expense',
        category: 'other',
        description: `Pagamento fatura - ${selectedPayCard.name}`,
        amount: parsedAmount,
        payment_method: 'transfer',
        date: paymentDate,
        is_installment: false,
        is_shared: false,
        is_paid: true,
        notes,
      });

      const nextUsed = Math.max(0, Number(selectedPayCard.used) - parsedAmount);
      const { error: cardErr } = await supabase
        .from('credit_cards')
        .update({ used: nextUsed })
        .eq('id', selectedPayCard.id)
        .eq('user_id', user.id);

      if (cardErr) throw cardErr;

      if (sourceAccount) {
        const nextBalance = Number(sourceAccount.balance) - parsedAmount;
        const { error: accErr } = await supabase
          .from('bank_accounts')
          .update({ balance: nextBalance })
          .eq('id', sourceAccount.id)
          .eq('user_id', user.id);
        if (accErr) throw accErr;
      }

      toast.success('Fatura registrada e saída lançada com sucesso.');
      qc.invalidateQueries({ queryKey: ['credit_cards'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['bank_accounts'] });
      setPayOpenCardId(null);
      resetPayForm();
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível registrar o pagamento da fatura.');
    } finally {
      setPaying(false);
    }
  };

  const adjustCardUsed = async () => {
    if (!user?.id || !selectedAdjustCard) return;
    const parsed = Number.parseFloat(adjustUsed.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Informe um valor de utilizado valido (>= 0).');
      return;
    }

    setAdjusting(true);
    try {
      const { error } = await supabase
        .from('credit_cards')
        .update({ used: parsed })
        .eq('id', selectedAdjustCard.id)
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Valor utilizado do cartao atualizado.');
      qc.invalidateQueries({ queryKey: ['credit_cards'] });
      setAdjustOpenCardId(null);
      resetAdjustForm();
    } catch (error: any) {
      toast.error(error?.message || 'Nao foi possivel atualizar o utilizado.');
    } finally {
      setAdjusting(false);
    }
  };

  if (bLoading || cLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Contas e Cartões</h1>

      {/* Bank Accounts */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-lg font-semibold">Contas Bancárias</h2>
          <Dialog open={accOpen} onOpenChange={setAccOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1"><Plus size={14} /> Adicionar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Conta Bancária</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome</Label><Input value={accName} onChange={e => setAccName(e.target.value)} placeholder="Ex: Nubank" /></div>
                <div><Label>Instituição</Label><Input value={accInst} onChange={e => setAccInst(e.target.value)} placeholder="Ex: Nu Pagamentos" /></div>
                <div><Label>Tipo</Label>
                  <Select value={accType} onValueChange={(v: any) => setAccType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Corrente</SelectItem>
                      <SelectItem value="savings">Poupança</SelectItem>
                      <SelectItem value="investment">Investimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Saldo inicial</Label><Input type="number" value={accBalance} onChange={e => setAccBalance(e.target.value)} placeholder="0.00" /></div>
                <div><Label>Cor</Label>
                  <div className="flex gap-2 mt-1">{COLORS.map(c => (
                    <button key={c} onClick={() => setAccColor(c)} className={`w-8 h-8 rounded-full border-2 ${accColor === c ? 'border-foreground' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                  ))}</div>
                </div>
                <Button onClick={addAccount} disabled={saving || !accName} className="w-full">
                  {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null} Criar Conta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold">{fmt(Number(acc.balance))}</p>
                    <button onClick={() => deleteAccount(acc.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                  </div>
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

      {/* Credit Cards */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-lg font-semibold">Cartões de Crédito</h2>
          <Dialog open={ccOpen} onOpenChange={setCcOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1"><Plus size={14} /> Adicionar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Cartão de Crédito</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome</Label><Input value={ccName} onChange={e => setCcName(e.target.value)} placeholder="Ex: Nubank Gold" /></div>
                <div><Label>Instituição</Label><Input value={ccInst} onChange={e => setCcInst(e.target.value)} placeholder="Ex: Nubank" /></div>
                <div><Label>Limite</Label><Input type="number" value={ccLimit} onChange={e => setCcLimit(e.target.value)} placeholder="5000" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Dia vencimento</Label><Input type="number" value={ccDue} onChange={e => setCcDue(e.target.value)} /></div>
                  <div><Label>Dia fechamento</Label><Input type="number" value={ccClosing} onChange={e => setCcClosing(e.target.value)} /></div>
                </div>
                <div><Label>Cor</Label>
                  <div className="flex gap-2 mt-1">{COLORS.map(c => (
                    <button key={c} onClick={() => setCcColor(c)} className={`w-8 h-8 rounded-full border-2 ${ccColor === c ? 'border-foreground' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                  ))}</div>
                </div>
                <Button onClick={addCard} disabled={saving || !ccName} className="w-full">
                  {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null} Criar Cartão
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {creditCards.map((cc) => {
            const pct = Math.round((Number(cc.used) / Number(cc.credit_limit)) * 100);
            return (
              <Card key={cc.id} className="animate-fade-in overflow-hidden">
                <div className="p-5 text-primary-foreground relative" style={{ background: `linear-gradient(135deg, ${cc.color}, ${cc.color}dd)` }}>
                  <div className="flex justify-between items-start">
                    <CreditCardIcon size={24} className="mb-4 opacity-80" />
                    <button onClick={() => deleteCard(cc.id)} className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"><Trash2 size={16} /></button>
                  </div>
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setPayOpenCardId(cc.id);
                      setPayAmount(Number(cc.used).toFixed(2));
                      setPayDate(format(new Date(), 'yyyy-MM-dd'));
                      setPayFromAccountId(bankAccounts[0]?.id || 'none');
                    }}
                  >
                    Pagar fatura
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setAdjustOpenCardId(cc.id);
                      setAdjustUsed(Number(cc.used).toFixed(2));
                    }}
                  >
                    Ajustar utilizado
                  </Button>
                  {pct > 80 && <p className="text-xs text-destructive font-medium">⚠ Cartão próximo do limite!</p>}
                </CardContent>
              </Card>
            );
          })}
          {creditCards.length === 0 && <p className="text-muted-foreground">Nenhum cartão cadastrado</p>}
        </div>
      </div>

      <Dialog
        open={!!payOpenCardId}
        onOpenChange={(open) => {
          if (!open) {
            setPayOpenCardId(null);
            resetPayForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar fatura {selectedPayCard ? `- ${selectedPayCard.name}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Valor pago</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0.00"
              />
              {selectedPayCard && (
                <p className="text-xs text-muted-foreground mt-1">
                  Valor utilizado atual: {fmt(Number(selectedPayCard.used))}
                </p>
              )}
            </div>

            <div>
              <Label>Data do pagamento</Label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>

            <div>
              <Label>Conta de origem (opcional)</Label>
              <Select value={payFromAccountId} onValueChange={setPayFromAccountId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não informar</SelectItem>
                  {bankAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={payCardInvoice} disabled={paying || addTransaction.isPending}>
              {(paying || addTransaction.isPending) ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Confirmar pagamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!adjustOpenCardId}
        onOpenChange={(open) => {
          if (!open) {
            setAdjustOpenCardId(null);
            resetAdjustForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar utilizado {selectedAdjustCard ? `- ${selectedAdjustCard.name}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Valor utilizado atual do cartao</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={adjustUsed}
                onChange={(e) => setAdjustUsed(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use este ajuste para sincronizar o valor real ja utilizado no app.
              </p>
            </div>
            <Button className="w-full" onClick={adjustCardUsed} disabled={adjusting}>
              {adjusting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Salvar valor utilizado
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
