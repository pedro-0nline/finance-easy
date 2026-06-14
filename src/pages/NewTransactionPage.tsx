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
import { paymentMethodLabels, categoryConfig } from '@/lib/categories';
import { AddCategoryDialog } from '@/components/AddCategoryDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

function parseCurrency(value: string) {
  if (!value) return 0;
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

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

  const amountNum = parseCurrency(amount);
  const installments = Math.max(2, parseInt(totalInstallments, 10) || 2);
  const perInstallment = amountNum / installments;

  const handleSave = async () => {
    if (!description.trim() || amountNum <= 0) {
      toast.error('Preencha os campos obrigatorios com valores validos.');
      return;
    }

    try {
      const isBuiltinCategory = Object.prototype.hasOwnProperty.call(categoryConfig, category);
      const categoryToSave = isBuiltinCategory ? category : 'other';
      const customCategoryNote = !isBuiltinCategory
        ? `Categoria personalizada selecionada: ${allCategories[category]?.label ?? category}.`
        : '';
      const mergedNotes = [customCategoryNote, notes].filter(Boolean).join(' ').trim() || undefined;

      if (isInstallment) {
        const groupId = crypto.randomUUID();
        for (let i = 0; i < installments; i++) {
          await addTransaction.mutateAsync({
            type,
            category: categoryToSave,
            description,
            amount: perInstallment,
            payment_method: paymentMethod,
            date,
            is_installment: true,
            installment_number: i + 1,
            total_installments: installments,
            installment_group_id: groupId,
            is_shared: false,
            is_paid: false,
            notes: mergedNotes,
          });
        }
      } else {
        await addTransaction.mutateAsync({
          type,
          category: categoryToSave,
          description,
          amount: amountNum,
          payment_method: paymentMethod,
          date,
          is_installment: false,
          is_shared: false,
          is_paid: false,
          notes: mergedNotes,
        });
      }

      if (!isBuiltinCategory) {
        toast.info('Categoria personalizada salva como "Outros" para compatibilidade com o banco.');
      }

      toast.success('Transacao salva com sucesso!');
      navigate('/app/transactions');
    } catch (error: any) {
      const message = error?.message || error?.details || 'Erro ao salvar. Tente novamente.';
      toast.error(message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Nova Transacao</h1>

      <div className="flex items-center gap-2">
        <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
      </div>

      {step === 1 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-base">O que e?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {(['income', 'expense', 'recurring', 'fixed'] as const).map((t) => (
                  <Button key={t} variant={type === t ? 'default' : 'outline'} size="sm" onClick={() => setType(t)}>
                    {{ income: 'Entrada', expense: 'Saida', recurring: 'Recorrente', fixed: 'Fixo' }[t]}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="desc">Descricao</Label>
              <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Supermercado" />
            </div>

            <div>
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" type="text" inputMode="decimal" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Categoria</Label>
                <AddCategoryDialog onCreated={(slug) => setCategory(slug)} />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(allCategories).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethodLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={() => setStep(2)} disabled={!description.trim() || amountNum <= 0}>
              Proximo
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-base">Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethod === 'credit_card' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Parcelado?</Label>
                  <Switch checked={isInstallment} onCheckedChange={setIsInstallment} />
                </div>
                {isInstallment && (
                  <div className="space-y-2">
                    <Label>Numero de parcelas</Label>
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
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observacoes..." />
            </div>

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">Preview da transacao:</p>
                <p className="font-medium">{description}</p>
                <p className="text-sm text-muted-foreground">
                  {isInstallment ? `${installments}x de R$ ${perInstallment.toFixed(2)}` : `R$ ${amountNum.toFixed(2)}`}
                  {' · '}
                  {allCategories[category]?.label ?? category}
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Voltar
              </Button>
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
