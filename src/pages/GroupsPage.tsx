import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useGroups } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { Users, Copy, QrCode, Loader2, Plus, LogIn, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/hooks/useSupabaseData';
import { QRCodeSVG } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function GroupsPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const { data: groups = [], isLoading } = useGroups();
  const [searchParams, setSearchParams] = useSearchParams();

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [qrGroupId, setQrGroupId] = useState<string | null>(null);

  // Auto-fill invite code from QR/shared link (?code=ABC123)
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
    const { error: gErr } = await supabase.from('groups').insert([{
      id: newId, name: groupName, owner_id: user.id, invite_code: code,
    }]);
    if (gErr) { toast.error('Erro ao criar grupo'); setSaving(false); return; }
    // Add owner as member (passes "Group owners can manage members" policy)
    const displayName = profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || '';
    const { error: mErr } = await supabase.from('group_members').insert([{
      group_id: newId, user_id: user.id, role: 'owner' as const, name: displayName,
    }]);
    if (mErr) { toast.error('Grupo criado, mas falha ao adicionar você como membro'); }
    else toast.success('Grupo criado!');
    qc.invalidateQueries({ queryKey: ['groups'] });
    setGroupName('');
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
      if (msg.includes('Already a member')) toast.error('Você já faz parte deste grupo');
      else if (msg.includes('Invalid invite code')) toast.error('Código inválido');
      else toast.error('Erro ao entrar no grupo');
      setSaving(false); return;
    }
    toast.success('Você entrou no grupo!');
    qc.invalidateQueries({ queryKey: ['groups'] });
    setInviteCode('');
    setJoinOpen(false);
    setSaving(false);
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase.from('group_members').delete().eq('id', memberId);
    if (error) { toast.error('Erro ao remover membro'); return; }
    toast.success('Membro removido');
    qc.invalidateQueries({ queryKey: ['groups'] });
  };

  const deleteGroup = async (groupId: string) => {
    const { error } = await supabase.from('groups').delete().eq('id', groupId);
    if (error) { toast.error('Erro ao excluir grupo'); return; }
    toast.success('Grupo excluído');
    qc.invalidateQueries({ queryKey: ['groups'] });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  const roleColors: Record<string, string> = {
    owner: 'bg-primary/10 text-primary',
    manager: 'bg-blue-500/10 text-blue-500',
    editor: 'bg-yellow-500/10 text-yellow-500',
    viewer: 'bg-muted text-muted-foreground',
  };
  const roleLabels: Record<string, string> = {
    owner: 'Dono', manager: 'Gerente', editor: 'Editor', viewer: 'Visualizador',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Grupos Familiares</h1>
        <div className="flex gap-2">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus size={14} /> Criar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Grupo</DialogTitle>
                <DialogDescription>Crie um grupo familiar para compartilhar finanças.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome do grupo</Label><Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Ex: Família Silva" /></div>
                <Button onClick={createGroup} disabled={saving || !groupName} className="w-full">
                  {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null} Criar Grupo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1"><LogIn size={14} /> Entrar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Entrar em um Grupo</DialogTitle>
                <DialogDescription>Use o código de convite recebido para entrar.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>Código de convite</Label><Input value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="Ex: ABC123" className="uppercase" /></div>
                <Button onClick={joinGroup} disabled={saving || !inviteCode} className="w-full">
                  {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null} Entrar no Grupo
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
            <p className="text-sm text-muted-foreground">Crie ou entre em um grupo familiar para compartilhar finanças</p>
          </div>
        </div>
      )}

      {groups.map((group: any) => {
        const members = group.group_members || [];
        const isOwner = group.owner_id === user?.id;

        return (
          <Card key={group.id} className="animate-fade-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users size={18} /> {group.name}
                </CardTitle>
                {isOwner && (
                  <button onClick={() => deleteGroup(group.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Excluir grupo">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {members.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {m.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                      </div>
                      <span className="text-sm font-medium">{m.name}</span>
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
                  <p className="text-xs text-muted-foreground">Código de convite</p>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-lg font-bold tracking-wider flex-1">{group.invite_code}</code>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => { navigator.clipboard.writeText(group.invite_code); toast.info('Código copiado!'); }}
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
                        <QRCodeSVG
                          value={`${window.location.origin}/app/groups?code=${group.invite_code}`}
                          size={180}
                          level="M"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Escaneie para entrar no grupo
                      </p>
                      <Button variant="ghost" size="sm" onClick={() => setQrGroupId(null)}>
                        Ocultar QR
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
