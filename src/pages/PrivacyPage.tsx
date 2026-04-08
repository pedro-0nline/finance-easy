export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Política de Privacidade</h1>
      <p className="text-sm text-muted-foreground mb-8">Última atualização: 8 de abril de 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="font-semibold text-lg mb-1">Sobre o FinControl</h2>
          <p>O FinControl é um aplicativo de controle financeiro pessoal e familiar que ajuda você a organizar receitas, despesas, metas e orçamentos.</p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-1">Dados coletados</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Nome e endereço de email (via cadastro ou login com Google)</li>
            <li>Eventos do Google Calendar (somente leitura, quando o usuário autoriza a integração)</li>
            <li>Dados financeiros inseridos pelo usuário (transações, contas, metas, orçamentos)</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-1">Como usamos seus dados</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Para autenticar e identificar sua conta</li>
            <li>Para exibir seus eventos do Google Calendar dentro do app</li>
            <li>Para fornecer funcionalidades de controle financeiro personalizadas</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-1">Compartilhamento de dados</h2>
          <p>Os dados obtidos do Google Calendar <strong>não são compartilhados com terceiros</strong>. Seus dados financeiros são armazenados de forma segura e acessíveis apenas por você.</p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-1">Revogação de acesso</h2>
          <p>Você pode revogar o acesso do FinControl à sua conta Google a qualquer momento em{' '}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              myaccount.google.com/permissions
            </a>.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-1">Contato</h2>
          <p>Em caso de dúvidas, entre em contato pelo email: <a href="mailto:contato@fincontrol.app" className="text-primary hover:underline">contato@fincontrol.app</a></p>
        </div>
      </section>

      <div className="mt-8 pt-4 border-t border-border">
        <a href="/auth" className="text-sm text-primary hover:underline">← Voltar ao login</a>
      </div>
    </div>
  );
}
