import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAddTransaction } from '@/hooks/useSupabaseData';
import { useAllCategories } from '@/hooks/useCategories';
import { paymentMethodLabels } from '@/lib/categories';
import { AddCategoryDialog } from '@/components/AddCategoryDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

export default function NewTransactionPage() {
  const navigate = useNavigate();
  const addTransaction = useAddTransaction();
  const { allCategories } = useAllCategories();
  const [step, setStep] = useState(1);
  const [type, setType] = useState('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('2');
  const [notes, setNotes] = useState('');

  const amountNum = parseFloat(amount.replace(',', '.')) || 0;
  const installments = parseInt(totalInstallments) || 2;
  const perInstallment = amountNum / installments;

  const handleSave = async () => {
    if (!description || !amountNum) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (isInstallment) {
        const groupId = crypto.randomUUID();
        for (let i = 0; i < installments; i++) {
          await addTransaction.mutateAsync({
            type, category, description,
            amount: perInstallment,
            payment_method: paymentMethod,
            date,
            is_installment: true,
            installment_number: i + 1,
            total_installments: installments,
            installment_group_id: groupId,
            is_shared: false,
            is_paid: false,
          });
        }
      } else {
        await addTransaction.mutateAsync({
          type, category, description,
          amount: amountNum,
          payment_method: paymentMethod,
          date,
          is_installment: false,
          is_shared: false,
          is_paid: false,
          notes: notes || undefined,
        });
      }
      toast.success('Transação salva com sucesso!');
      navigate('/transactions');
    } catch {
      toast.error('Erro ao salvar. Tente novamente.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Nova Transação</h1>

      <div className="flex items-center gap-2">
        <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
      </div>

      {step === 1 && (
        <Card className="animate-fade-in">
          <CardHeader><CardTitle className="text-base">O que é?</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {(['income', 'expense', 'recurring', 'fixed'] as const).map((t) => (
                  <Button key={t} variant={type === t ? 'default' : 'outline'} size="sm" onClick={() => setType(t)}>
                    {{ income: 'Entrada', expense: 'Saída', recurring: 'Recorrente', fixed: 'Fixo' }[t]}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="desc">Descrição</Label>
              <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Supermercado" />
            </div>
            <div>
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" type="text" inputMode="decimal" />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryConfig).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethodLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => setStep(2)} disabled={!description || !amountNum}>
              Próximo
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="animate-fade-in">
          <CardHeader><CardTitle className="text-base">Detalhes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {paymentMethod === 'credit_card' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Parcelado?</Label>
                  <Switch checked={isInstallment} onCheckedChange={setIsInstallment} />
                </div>
                {isInstallment && (
                  <div className="space-y-2">
                    <Label>Número de parcelas</Label>
                    <Input type="number" min={2} max={48} value={totalInstallments} onChange={(e) => setTotalInstallments(e.target.value)} />
                    <p className="text-sm text-muted-foreground">
                      {installments}x de R$ {perInstallment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            )}
            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações..." />
            </div>

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">Preview da transação:</p>
                <p className="font-medium">{description}</p>
                <p className="text-sm text-muted-foreground">
                  {isInstallment ? `${installments}x de R$ ${perInstallment.toFixed(2)}` : `R$ ${amountNum.toFixed(2)}`}
                  {' · '}{categoryConfig[category as keyof typeof categoryConfig]?.label}
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Voltar</Button>
              <Button className="flex-1" onClick={handleSave} disabled={addTransaction.isPending}>
                {addTransaction.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
