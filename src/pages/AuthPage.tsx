import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) toast.error(error.message);
      else toast.success('Email enviado! Verifique sua caixa de entrada.');
      setLoading(false);
      return;
    }

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) toast.error(error.message);
    } else {
      if (!name.trim()) { toast.error('Informe seu nome'); setLoading(false); return; }
      const { error } = await signUp(email, password, name);
      if (error) toast.error(error.message);
      else toast.success('Conta criada! Verifique seu email para confirmar.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
            <Wallet size={24} className="text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">FinControl</CardTitle>
          <p className="text-sm text-muted-foreground">
            {mode === 'login' ? 'Entre na sua conta' : mode === 'register' ? 'Crie sua conta' : 'Recuperar senha'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
            </div>
            {mode !== 'forgot' && (
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button type="button" onClick={() => setMode('forgot')} className="text-xs text-primary hover:underline">
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              {mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : 'Enviar email de recuperação'}
            </Button>
          </form>

          {mode === 'forgot' ? (
            <div className="text-center mt-4">
              <button onClick={() => setMode('login')} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                <ArrowLeft size={14} /> Voltar ao login
              </button>
            </div>
          ) : (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">ou</span></div>
              </div>

              <Button variant="outline" className="w-full gap-2" onClick={signInWithGoogle}>
                <svg viewBox="0 0 24 24" className="w-4 h-4"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continuar com Google
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4 leading-relaxed">
                Ao continuar com o Google, você concorda com nossos{' '}
                <a href="/termos" className="text-primary hover:underline">Termos de Uso</a> e{' '}
                <a href="/privacidade" className="text-primary hover:underline">Política de Privacidade</a>, e com os{' '}
                <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Termos de Serviço</a> e{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Política de Privacidade</a> do Google.
              </p>

              <div className="text-center mt-3">
                <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-sm text-primary hover:underline">
                  {mode === 'login' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}