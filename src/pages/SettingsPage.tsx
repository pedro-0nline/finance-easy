import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useSupabaseData';
import { User, Calendar, Moon, Sun, Globe, Webhook, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { theme, setTheme } = useStore();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Card className="animate-fade-in">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><User size={18} /> Perfil</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">{initials}</div>
            <div>
              <p className="font-medium">{displayName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { signOut(); toast.info('Desconectado!'); }}>
            <LogOut size={14} /> Sair da conta
          </Button>
        </CardContent>
      </Card>

      <Card className="animate-fade-in">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar size={18} /> Google Calendar</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-xs text-muted-foreground">Desconectado</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.info('Integração mock — conectado com sucesso!')}>Conectar</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe size={18} /> Preferências</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              <Label>Tema escuro</Label>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={(c) => setTheme(c ? 'dark' : 'light')} />
          </div>
          <Separator />
          <div>
            <Label>Moeda padrão</Label>
            <Select defaultValue="BRL">
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">R$ Real Brasileiro</SelectItem>
                <SelectItem value="USD">$ Dólar Americano</SelectItem>
                <SelectItem value="EUR">€ Euro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Primeiro dia da semana</Label>
            <Select defaultValue="monday">
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sunday">Domingo</SelectItem>
                <SelectItem value="monday">Segunda-feira</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Webhook size={18} /> N8N Webhook</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>URL do Webhook</Label>
            <Input placeholder="https://n8n.example.com/webhook/..." className="mt-1" />
          </div>
          <div>
            <Label>API Key</Label>
            <Input type="password" placeholder="••••••••" className="mt-1" />
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.success('Conexão testada com sucesso!')}>Testar conexão</Button>
        </CardContent>
      </Card>
    </div>
  );
}
