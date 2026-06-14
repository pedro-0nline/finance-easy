export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 max-w-3xl mx-auto">
      <p className="text-sm font-semibold text-primary mb-2">FinanceEasy</p>
      <h1 className="text-2xl font-bold mb-2">Politica de Privacidade</h1>
      <p className="text-sm text-muted-foreground mb-8">Ultima atualizacao: 14 de junho de 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="font-semibold text-lg mb-1">Sobre o FinanceEasy</h2>
          <p>O FinanceEasy e um aplicativo de controle financeiro pessoal e familiar.</p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-1">Dados coletados no Login com Google</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Email</li>
            <li>Nome</li>
            <li>Foto de perfil</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-1">Como usamos esses dados</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Para autenticar sua conta</li>
            <li>Para identificar voce dentro do app</li>
            <li>Para exibir seu perfil no FinanceEasy</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-1">Compartilhamento</h2>
          <p>O FinanceEasy nao vende e nao compartilha esses dados com terceiros.</p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-1">Revogacao de acesso</h2>
          <p>Voce pode revogar o acesso do FinanceEasy a sua conta Google a qualquer momento em{' '}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              myaccount.google.com/permissions
            </a>.
          </p>
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
