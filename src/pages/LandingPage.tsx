import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  PieChart,
  Target,
  Users,
  CalendarDays,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    icon: Wallet,
    title: 'Controle de Gastos',
    desc: 'Registre receitas e despesas, parcele compras e acompanhe seu saldo em tempo real.',
  },
  {
    icon: PieChart,
    title: 'Orçamento Inteligente',
    desc: 'Defina limites por categoria e receba alertas antes de estourar o orçamento.',
  },
  {
    icon: Target,
    title: 'Metas Financeiras',
    desc: 'Crie metas de economia e acompanhe seu progresso com gráficos visuais.',
  },
  {
    icon: Users,
    title: 'Grupos Familiares',
    desc: 'Compartilhe despesas com sua família ou amigos e divida contas facilmente.',
  },
  {
    icon: CalendarDays,
    title: 'Integração com Google Agenda',
    desc: 'Conecte sua agenda para visualizar compromissos financeiros no calendário.',
  },
  {
    icon: ShieldCheck,
    title: 'Segurança & Privacidade',
    desc: 'Seus dados são protegidos com criptografia e nunca compartilhados com terceiros.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
          <span className="text-xl font-bold text-primary">FinanceNew</span>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="outline" size="sm">
                Entrar
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">
                Criar conta <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Controle financeiro pessoal e familiar,{' '}
            <span className="text-primary">simples e poderoso</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            O FinanceNew ajuda você a organizar suas finanças, definir metas, acompanhar
            orçamentos e compartilhar despesas com sua família — tudo em um só lugar.
          </p>
          <Link to="/auth">
            <Button size="lg" className="mt-4">
              Comece gratuitamente <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-muted/40">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">
            Tudo que você precisa para suas finanças
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 space-y-3"
              >
                <f.icon className="h-8 w-8 text-primary" />
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl font-bold">Pronto para organizar suas finanças?</h2>
          <p className="text-muted-foreground">
            Crie sua conta em segundos e comece a ter controle total do seu dinheiro.
          </p>
          <Link to="/auth">
            <Button size="lg" className="mt-2">
              Criar conta gratuita
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} FinanceNew. Todos os direitos reservados.</span>
          <div className="flex gap-4">
            <Link to="/privacidade" className="hover:text-foreground transition-colors">
              Política de Privacidade
            </Link>
            <Link to="/termos" className="hover:text-foreground transition-colors">
              Termos de Uso
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
