import React from 'react';
import { Link } from 'react-router-dom';
import { Receipt, ArrowLeft } from 'lucide-react';
import { ROUTES } from '../config/site';

/**
 * Public Terms of Service page.
 * Google verification asks for both a Privacy Policy and Terms of Service URL.
 * Reachable at: https://finance.pedropaulocf.com.br/terms
 */
export function TermsOfService() {
  const lastUpdated = '13/06/2026';
  const contactEmail = 'pedropaulocardosoferreira01@gmail.com';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to={ROUTES.home} className="flex items-center">
            <Receipt className="h-7 w-7 text-blue-500" />
            <span className="ml-2 text-lg font-bold text-gray-900">FinanceEasy</span>
          </Link>
          <Link
            to={ROUTES.home}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar ao início
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose prose-blue">
        <h1 className="text-3xl font-bold text-gray-900">Termos de Serviço</h1>
        <p className="text-sm text-gray-500">Última atualização: {lastUpdated}</p>

        <h2>1. Aceitação dos termos</h2>
        <p>
          Ao acessar e utilizar o FinanceEasy, você concorda com estes Termos de Serviço e
          com a nossa{' '}
          <Link to={ROUTES.privacy}>Política de Privacidade</Link>.
        </p>

        <h2>2. Descrição do serviço</h2>
        <p>
          O FinanceEasy é um aplicativo de gestão financeira pessoal que permite organizar
          recibos, contas, despesas recorrentes e relatórios.
        </p>

        <h2>3. Conta do usuário</h2>
        <p>
          Você é responsável por manter a confidencialidade das suas credenciais e por todas
          as atividades realizadas na sua conta. O login pode ser feito por e-mail e senha ou
          pela sua conta Google.
        </p>

        <h2>4. Uso aceitável</h2>
        <p>
          Você concorda em não utilizar o serviço para fins ilícitos nem tentar comprometer a
          segurança ou a integridade da plataforma.
        </p>

        <h2>5. Assinaturas e pagamentos</h2>
        <p>
          Algumas funcionalidades exigem uma assinatura paga, processada por meio do Stripe.
          Os valores e condições são apresentados no momento da contratação.
        </p>

        <h2>6. Limitação de responsabilidade</h2>
        <p>
          O serviço é fornecido "no estado em que se encontra". Não nos responsabilizamos por
          decisões financeiras tomadas com base nas informações do aplicativo.
        </p>

        <h2>7. Alterações</h2>
        <p>
          Podemos atualizar estes termos periodicamente. O uso contínuo do serviço após
          alterações representa a aceitação dos novos termos.
        </p>

        <h2>8. Contato</h2>
        <p>
          Dúvidas? Entre em contato: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
      </main>
    </div>
  );
}
