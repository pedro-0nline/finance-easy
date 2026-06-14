import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MoreVertical, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CategoryIconBySlug } from '@/components/CategoryIcon';
import { useAllCategories } from '@/hooks/useCategories';
import { AmountBadge } from '@/components/AmountBadge';
import { TransactionTypeBadge, PaymentMethodBadge, InstallmentBadge } from '@/components/Badges';
import { useTransactions, useTogglePaid, useDeleteTransaction } from '@/hooks/useSupabaseData';
import { paymentMethodLabels } from '@/lib/categories';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Category } from '@/types';

export default function TransactionsPage() {
  const { data: transactions = [], isLoading } = useTransactions();
  const { allCategories } = useAllCategories();
  const togglePaid = useTogglePaid();
  const deleteTxn = useDeleteTransaction();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [unpaidOnly, setUnpaidOnly] = useState(false);

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
        if (paymentFilter !== 'all' && t.payment_method !== paymentFilter) return false;
        if (unpaidOnly && t.is_paid) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, search, typeFilter, categoryFilter, paymentFilter, unpaidOnly]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((t) => {
      const day = t.date.split('T')[0];
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(t);
    });
    return Array.from(map.entries());
  }, [filtered]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Transações</h1>
        <Link to="/app/transactions/new">
          <Button size="sm" className="gap-1 shrink-0"><Plus size={16} /> Nova</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input placeholder="Buscar transação..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="income">Entrada</SelectItem>
                <SelectItem value="expense">Saída</SelectItem>
                <SelectItem value="recurring">Recorrente</SelectItem>
                <SelectItem value="fixed">Fixo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(allCategories).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger><SelectValue placeholder="Pagamento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(paymentMethodLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Checkbox id="unpaid" checked={unpaidOnly} onCheckedChange={(c) => setUnpaidOnly(c === true)} />
            <label htmlFor="unpaid" className="text-sm text-muted-foreground">Apenas não pagas</label>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {grouped.map(([day, txns]) => {
          const dayTotal = txns.reduce((s, t) => s + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
          return (
            <div key={day}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {format(parseISO(day), "dd 'de' MMMM", { locale: ptBR })}
                </h3>
                <span className={`text-xs font-mono font-medium shrink-0 ${dayTotal >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {dayTotal >= 0 ? '+' : ''}{dayTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <Card>
                <CardContent className="p-0 divide-y divide-border">
                  {txns.map((t) => (
                    <div key={t.id} className="flex items-start sm:items-center gap-3 p-3 hover:bg-accent/50 transition-colors">
                      <CategoryIconBySlug category={t.category} categories={allCategories} size={14} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium truncate">{t.description}</p>
                          {t.is_installment && <InstallmentBadge current={t.installment_number!} total={t.total_installments!} />}
                          {t.is_shared && <span className="text-xs bg-info/10 text-info px-1.5 py-0.5 rounded">Compartilhado</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <TransactionTypeBadge type={t.type} />
                          <PaymentMethodBadge method={t.payment_method} />
                        </div>
                      </div>
                      <div className="flex flex-col-reverse sm:flex-row items-end sm:items-center gap-2 sm:gap-3 shrink-0">
                        <Checkbox checked={t.is_paid} onCheckedChange={() => togglePaid.mutate({ id: t.id, isPaid: t.is_paid })} />
                        <AmountBadge amount={Number(t.amount)} type={t.type === 'income' ? 'income' : 'expense'} />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => deleteTxn.mutate(t.id)} className="text-destructive">
                              <Trash2 size={14} className="mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          );
        })}
        {grouped.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhuma transação encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
