export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 max-w-3xl mx-auto">
      <p className="text-sm font-semibold text-primary mb-2">FinanceEasy</p>
      <h1 className="text-2xl font-bold mb-2">Termos de Uso</h1>
      <p className="text-sm text-muted-foreground mb-8">Ultima atualizacao: 14 de junho de 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="font-semibold text-lg mb-1">Sobre o servico</h2>
          <p>O FinanceEasy e uma plataforma para organizar financas pessoais e familiares.</p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-1">Uso permitido</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Uso pessoal e familiar</li>
            <li>Voce e responsavel pelos dados que cadastrar</li>
            <li>O uso para atividades ilegais nao e permitido</li>
            <li>Voce deve proteger suas credenciais de acesso</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-1">Limitacao de responsabilidade</h2>
          <p>O FinanceEasy e fornecido como esta, sem garantias. Nao nos responsabilizamos por:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Decisoes financeiras tomadas com base no app</li>
            <li>Perda de dados por falhas tecnicas ou uso indevido</li>
            <li>Indisponibilidade temporaria do servico</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-1">Alteracoes dos termos</h2>
          <p>Podemos atualizar estes termos a qualquer momento. A versao mais recente ficara sempre nesta pagina.</p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-1">Contato</h2>
          <p>Em caso de duvidas, entre em contato pelo email: <a href="mailto:contato@fincontrol.app" className="text-primary hover:underline">contato@fincontrol.app</a></p>
        </div>
      </section>

      <div className="mt-8 pt-4 border-t border-border">
        <a href="/auth" className="text-sm text-primary hover:underline">&larr; Voltar ao login</a>
      </div>
    </div>
  );
}
