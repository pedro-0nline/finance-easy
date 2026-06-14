import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGroups, useProfile } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import {
  useCoupleOverview,
  useCreateSharedExpense,
  useGroupMembers,
  useSharedExpenses,
  useSharedExpenseSettlements,
  useUpdateSharedParticipantPaid,
} from '@/hooks/useGroupFinance';
import { Users, Copy, QrCode, Loader2, Plus, LogIn, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { format } from 'date-fns';

type GroupRow = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  kind?: 'general' | 'couple';
  group_members?: Array<{ id: string; user_id: string; name: string; role: string }>;
};

function BRL({ value }: { value: number }) {
  return <>{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</>;
}

function GroupFinanceCard({ group, currentUserId }: { group: GroupRow; currentUserId?: string }) {
  const { data: members = [] } = useGroupMembers(group.id);
  const { data: coupleOverview } = useCoupleOverview(group.kind === 'couple' ? group.id : undefined);
  const { data: sharedExpenses = [] } = useSharedExpenses(group.id);
  const { settlements } = useSharedExpenseSettlements(group.id);
  const createSharedExpense = useCreateSharedExpense();
  const updateParticipantPaid = useUpdateSharedParticipantPaid();

  const [splitOpen, setSplitOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory] = useState('other');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [paidMap, setPaidMap] = useState<Record<string, string>>({});

  const totalNumber = Number.parseFloat(totalAmount.replace(',', '.')) || 0;
  const splitPerPerson = members.length > 0 ? totalNumber / members.length : 0;

  useEffect(() => {
    if (!splitOpen) return;
    const next: Record<string, string> = {};
    members.forEach((m) => {
      next[m.user_id] = paidMap[m.user_id] ?? '0';
    });
    setPaidMap(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitOpen, members.length]);

  const memberNameById = useMemo(() => {
    const map: Record<string, string> = {};
    members.forEach((m) => {
      map[m.user_id] = m.name;
    });
    return map;
  }, [members]);

  const createSplitExpense = async () => {
    if (!title.trim() || totalNumber <= 0 || members.length === 0) {
      toast.error('Preencha titulo, valor e membros.');
      return;
    }

    try {
      await createSharedExpense.mutateAsync({
        group_id: group.id,
        title,
        description,
        total_amount: totalNumber,
        expense_date: expenseDate,
        category,
        payment_method: paymentMethod,
        split_method: 'equal',
        participants: members.map((m) => ({
          user_id: m.user_id,
          should_pay: Number(splitPerPerson.toFixed(2)),
          paid_amount: Number((Number.parseFloat((paidMap[m.user_id] || '0').replace(',', '.')) || 0).toFixed(2)),
        })),
      });

      toast.success('Despesa compartilhada criada.');
      setSplitOpen(false);
      setTitle('');
      setDescription('');
      setTotalAmount('');
      setPaidMap({});
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar despesa compartilhada.');
    }
  };

  return (
    <div className="space-y-4">
      {group.kind === 'couple' && coupleOverview && (
        <div className="rounded-lg border border-border p-3 space-y-2">
          <p className="text-sm font-semibold">Visao do casal (mes atual)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-accent/40 p-2">
              <p className="text-xs text-muted-foreground">Entradas conjuntas</p>
              <p className="font-medium"><BRL value={coupleOverview.combined.income} /></p>
            </div>
            <div className="rounded-md bg-accent/40 p-2">
              <p className="text-xs text-muted-foreground">Saidas conjuntas</p>
              <p className="font-medium"><BRL value={coupleOverview.combined.expenses} /></p>
            </div>
          </div>
          <div className="space-y-1">
            {Object.entries(coupleOverview.byUser).map(([uid, data]) => (
              <div key={uid} className="text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-border/50 pb-1 last:border-0">
                <span className="font-medium">{data.name || uid}</span>
                <span className="break-words">
                  Entradas <BRL value={data.income} /> | Saidas <BRL value={data.expenses} /> | Saldo <BRL value={data.net} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-sm font-semibold">Rachar conta no grupo</p>
        <Dialog open={splitOpen} onOpenChange={setSplitOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 w-full sm:w-auto"><DollarSign size={14} /> Nova despesa compartilhada</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar racha de conta</DialogTitle>
              <DialogDescription>
                Informe o valor total e quanto cada pessoa ja pagou.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Titulo</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Jantar, Mercado, Viagem" />
                </div>
                <div>
                  <Label>Data</Label>
                  <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>Valor total</Label>
                  <Input value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="200,00" />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Alimentacao</SelectItem>
                      <SelectItem value="health">Saude</SelectItem>
                      <SelectItem value="transport">Transporte</SelectItem>
                      <SelectItem value="education">Educacao</SelectItem>
                      <SelectItem value="leisure">Lazer</SelectItem>
                      <SelectItem value="housing">Moradia</SelectItem>
                      <SelectItem value="utilities">Utilidades</SelectItem>
                      <SelectItem value="other">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="credit_card">Cartao de credito</SelectItem>
                      <SelectItem value="debit_card">Cartao de debito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Descricao (opcional)</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes da conta" />
              </div>

              <div className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-sm">Divisao igual: <strong><BRL value={splitPerPerson || 0} /></strong> por pessoa</p>
                <p className="text-xs text-muted-foreground">Quanto cada um ja pagou:</p>
                {members.map((m) => (
                  <div key={m.user_id} className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-2 items-center">
                    <span className="text-sm">{m.name}</span>
                    <Input
                      value={paidMap[m.user_id] || ''}
                      onChange={(e) => setPaidMap((prev) => ({ ...prev, [m.user_id]: e.target.value }))}
                      placeholder="0,00"
                    />
                  </div>
                ))}
              </div>

              <Button className="w-full" onClick={createSplitExpense} disabled={createSharedExpense.isPending}>
                {createSharedExpense.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                Salvar racha
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {sharedExpenses.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma despesa compartilhada ainda.</p>}
        {sharedExpenses.map((expense: any) => (
          <div key={expense.id} className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{expense.title}</p>
                <p className="text-xs text-muted-foreground">
                  {expense.expense_date} - Total <BRL value={Number(expense.total_amount) || 0} />
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {(expense.shared_expense_participants || []).map((p: any) => {
                const shouldPay = Number(p.should_pay) || 0;
                const paid = Number(p.paid_amount) || 0;
                const delta = paid - shouldPay;
                const canEdit = p.user_id === currentUserId;
                return (
                  <div key={p.id} className="rounded-md border border-border/60 p-2">
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-center text-xs">
                      <span className="font-medium">{memberNameById[p.user_id] || p.user_id}</span>
                      <span>Deveria: <BRL value={shouldPay} /></span>
                      <span className={delta >= 0 ? 'text-green-500' : 'text-red-500'}>
                        Saldo: <BRL value={delta} />
                      </span>
                      <div className="flex items-center gap-1 min-w-0">
                      <Input
                        defaultValue={paid.toString()}
                        onBlur={(e) => {
                          if (!canEdit) return;
                          const next = Number.parseFloat(e.target.value.replace(',', '.')) || 0;
                          updateParticipantPaid.mutate({ participant_id: p.id, paid_amount: next, group_id: group.id });
                        }}
                        disabled={!canEdit || updateParticipantPaid.isPending}
                      />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {settlements.length > 0 && (
        <div className="rounded-lg border border-border p-3">
          <p className="text-sm font-semibold mb-2">Quem deve para quem</p>
          <div className="space-y-1 text-xs">
            {settlements.map((s, idx) => (
              <p key={`${s.from_user_id}-${s.to_user_id}-${idx}`}>
                {memberNameById[s.from_user_id] || s.from_user_id} deve <BRL value={s.amount} /> para {memberNameById[s.to_user_id] || s.to_user_id}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GroupsPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const { data: groups = [], isLoading } = useGroups();
  const [searchParams, setSearchParams] = useSearchParams();

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupKind, setGroupKind] = useState<'general' | 'couple'>('general');
  const [inviteCode, setInviteCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [qrGroupId, setQrGroupId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setInviteCode(code.toUpperCase());
      setJoinOpen(true);
      searchParams.delete('code');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const createGroup = async () => {
    if (!groupName || !user) return;
    setSaving(true);
    const code = generateCode();
    const newId = crypto.randomUUID();

    const { error: gErr } = await supabase.from('groups').insert([
      {
        id: newId,
        name: groupName,
        owner_id: user.id,
        invite_code: code,
        kind: groupKind,
      },
    ]);

    if (gErr) {
      toast.error('Erro ao criar grupo');
      setSaving(false);
      return;
    }

    const displayName = profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || '';
    const { error: mErr } = await supabase.from('group_members').insert([
      {
        group_id: newId,
        user_id: user.id,
        role: 'owner' as const,
        name: displayName,
      },
    ]);

    if (mErr) toast.error('Grupo criado, mas falha ao adicionar voce como membro');
    else toast.success('Grupo criado!');

    qc.invalidateQueries({ queryKey: ['groups'] });
    setGroupName('');
    setGroupKind('general');
    setCreateOpen(false);
    setSaving(false);
  };

  const joinGroup = async () => {
    if (!inviteCode || !user) return;
    setSaving(true);
    const { error } = await supabase.rpc('join_group_by_code', {
      _invite_code: inviteCode.toUpperCase(),
    });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Already a member')) toast.error('Voce ja faz parte deste grupo');
      else if (msg.includes('Invalid invite code')) toast.error('Codigo invalido');
      else toast.error('Erro ao entrar no grupo');
      setSaving(false);
      return;
    }

    toast.success('Voce entrou no grupo!');
    qc.invalidateQueries({ queryKey: ['groups'] });
    setInviteCode('');
    setJoinOpen(false);
    setSaving(false);
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase.from('group_members').delete().eq('id', memberId);
    if (error) {
      toast.error('Erro ao remover membro');
      return;
    }
    toast.success('Membro removido');
    qc.invalidateQueries({ queryKey: ['groups'] });
  };

  const deleteGroup = async (groupId: string) => {
    const { error } = await supabase.from('groups').delete().eq('id', groupId);
    if (error) {
      toast.error('Erro ao excluir grupo');
      return;
    }
    toast.success('Grupo excluido');
    qc.invalidateQueries({ queryKey: ['groups'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    owner: 'bg-primary/10 text-primary',
    manager: 'bg-blue-500/10 text-blue-500',
    editor: 'bg-yellow-500/10 text-yellow-500',
    viewer: 'bg-muted text-muted-foreground',
  };

  const roleLabels: Record<string, string> = {
    owner: 'Dono',
    manager: 'Gerente',
    editor: 'Editor',
    viewer: 'Visualizador',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Grupos</h1>
        <div className="flex w-full sm:w-auto gap-2">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1 flex-1 sm:flex-none">
                <Plus size={14} /> Criar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar novo grupo</DialogTitle>
                <DialogDescription>
                  Use tipo "Casal" para consolidar visao financeira conjunta.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome do grupo</Label>
                  <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Ex: Casa Pedro e Ana" />
                </div>
                <div>
                  <Label>Tipo do grupo</Label>
                  <Select value={groupKind} onValueChange={(v: 'general' | 'couple') => setGroupKind(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Geral (amigos/familia)</SelectItem>
                      <SelectItem value="couple">Casal (visao conjunta)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createGroup} disabled={saving || !groupName} className="w-full">
                  {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Criar grupo
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1 flex-1 sm:flex-none">
                <LogIn size={14} /> Entrar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Entrar em grupo</DialogTitle>
                <DialogDescription>Use o codigo de convite ou QR.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Codigo de convite</Label>
                  <Input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="ABC123" className="uppercase" />
                </div>
                <Button type="button" variant="outline" className="w-full gap-1" onClick={() => setScanning((s) => !s)}>
                  <QrCode size={14} /> {scanning ? 'Fechar camera' : 'Escanear QR code'}
                </Button>
                {scanning && (
                  <div className="rounded-lg overflow-hidden border">
                    <Scanner
                      onScan={(results) => {
                        const raw = results?.[0]?.rawValue;
                        if (!raw) return;
                        try {
                          const url = new URL(raw);
                          const code = url.searchParams.get('code');
                          if (code) {
                            setInviteCode(code.toUpperCase());
                            setScanning(false);
                            return;
                          }
                        } catch {
                          // ignore
                        }
                        setInviteCode(raw.toUpperCase());
                        setScanning(false);
                      }}
                      onError={() => toast.error('Nao foi possivel acessar a camera')}
                      constraints={{ facingMode: 'environment' }}
                    />
                  </div>
                )}
                <Button onClick={joinGroup} disabled={saving || !inviteCode} className="w-full">
                  {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Entrar no grupo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {groups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <Users size={48} className="text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">Nenhum grupo</h2>
            <p className="text-sm text-muted-foreground">Crie um grupo de casal ou grupo de racha para comecar.</p>
          </div>
        </div>
      )}

      {(groups as GroupRow[]).map((group) => {
        const members = group.group_members || [];
        const isOwner = group.owner_id === user?.id;

        return (
          <Card key={group.id} className="animate-fade-in">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2 min-w-0">
                  <Users size={18} /> {group.name}
                  <Badge variant="secondary" className="shrink-0">{group.kind === 'couple' ? 'Casal' : 'Geral'}</Badge>
                </CardTitle>
                {isOwner && (
                  <button onClick={() => deleteGroup(group.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0" title="Excluir grupo">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-accent/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {m.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || '?'}
                      </div>
                      <span className="text-sm font-medium truncate">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={roleColors[m.role] || ''}>
                        {roleLabels[m.role] || m.role}
                      </Badge>
                      {isOwner && m.user_id !== user?.id && (
                        <button onClick={() => removeMember(m.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {isOwner && (
                <div className="p-4 rounded-lg bg-muted space-y-3">
                  <p className="text-xs text-muted-foreground">Codigo de convite</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <code className="font-mono text-lg font-bold tracking-wider flex-1 break-all">{group.invite_code}</code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(group.invite_code);
                        toast.info('Codigo copiado!');
                      }}
                    >
                      <Copy size={14} className="mr-1" /> Copiar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setQrGroupId(group.id)}>
                      <QrCode size={14} className="mr-1" /> QR
                    </Button>
                  </div>
                  {qrGroupId === group.id && (
                    <div className="flex flex-col items-center gap-2 pt-2">
                      <div className="bg-white p-3 rounded-lg">
                        <QRCodeSVG value={`${window.location.origin}/app/groups?code=${group.invite_code}`} size={180} level="M" />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">Escaneie para entrar no grupo</p>
                      <Button variant="ghost" size="sm" onClick={() => setQrGroupId(null)}>
                        Ocultar QR
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <GroupFinanceCard group={group} currentUserId={user?.id} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
