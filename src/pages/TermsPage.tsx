export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Termos de Uso</h1>
      <p className="text-sm text-muted-foreground mb-8">Última atualização: 8 de abril de 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="font-semibold text-lg mb-1">O que é o FinControl</h2>
          <p>O FinControl é um aplicativo web de controle financeiro pessoal e familiar. Ele permite registrar transações, definir orçamentos, acompanhar metas financeiras, gerenciar contas bancárias e cartões de crédito, e integrar com o Google Calendar para visualização de eventos.</p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-1">Uso permitido</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>O app é destinado ao uso pessoal e familiar</li>
            <li>Você é responsável pela veracidade dos dados financeiros inseridos</li>
            <li>Não é permitido usar o app para atividades ilegais ou prejudiciais</li>
            <li>Você deve manter suas credenciais de acesso em sigilo</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-1">Limitação de responsabilidade</h2>
          <p>O FinControl é fornecido "como está", sem garantias de qualquer tipo. Não nos responsabilizamos por:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Decisões financeiras tomadas com base nas informações do app</li>
            <li>Perda de dados devido a falhas técnicas ou uso indevido</li>
            <li>Indisponibilidade temporária do serviço</li>
            <li>Imprecisões nos dados do Google Calendar sincronizados</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-1">Alterações nos termos</h2>
          <p>Podemos atualizar estes termos a qualquer momento. Alterações significativas serão comunicadas dentro do app.</p>
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
