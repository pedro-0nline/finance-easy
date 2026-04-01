import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { Users, Copy, QrCode } from 'lucide-react';
import { toast } from 'sonner';

export default function GroupsPage() {
  const { group } = useStore();

  if (!group) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Grupos Familiares</h1>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <Users size={48} className="text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">Nenhum grupo</h2>
            <p className="text-sm text-muted-foreground">Crie ou entre em um grupo familiar</p>
          </div>
          <div className="flex gap-3">
            <Button>Criar novo grupo</Button>
            <Button variant="outline">Entrar em grupo</Button>
          </div>
        </div>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    owner: 'bg-primary/10 text-primary',
    manager: 'bg-info/10 text-info',
    editor: 'bg-warning/10 text-warning',
    viewer: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Grupos Familiares</h1>

      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users size={18} /> {group.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Members */}
          <div className="space-y-2">
            {group.members.map((m) => (
              <div key={m.userId} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    {m.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <span className="text-sm font-medium">{m.name}</span>
                </div>
                <Badge variant="secondary" className={roleColors[m.role]}>
                  {{ owner: 'Dono', manager: 'Gerente', editor: 'Editor', viewer: 'Visualizador' }[m.role]}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invite */}
      <Card className="animate-fade-in">
        <CardHeader><CardTitle className="text-base">Convidar Membro</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
            <code className="font-mono text-lg font-bold tracking-wider flex-1">{group.inviteCode}</code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { navigator.clipboard.writeText(group.inviteCode); toast.info('Código copiado!'); }}
            >
              <Copy size={14} className="mr-1" /> Copiar
            </Button>
          </div>
          <div className="flex items-center justify-center py-6 border rounded-lg border-dashed">
            <div className="text-center text-muted-foreground">
              <QrCode size={64} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">QR Code do convite</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">Expira em 15 minutos</p>
        </CardContent>
      </Card>
    </div>
  );
}
