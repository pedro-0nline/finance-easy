import React from 'react';
import { Link } from 'react-router-dom';
import { Receipt, ArrowLeft } from 'lucide-react';
import { OFFICIAL_DOMAIN, ROUTES } from '../config/site';

/**
 * Public Privacy Policy page (required by Google OAuth verification).
 * Must be reachable at a public URL with no authentication:
 *   https://finance.pedropaulocf.com.br/privacy
 */
export function PrivacyPolicy() {
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
        <h1 className="text-3xl font-bold text-gray-900">Política de Privacidade</h1>
        <p className="text-sm text-gray-500">Última atualização: {lastUpdated}</p>

        <p>
          Esta Política de Privacidade descreve como o <strong>FinanceEasy</strong>{' '}
          (<a href={OFFICIAL_DOMAIN}>{OFFICIAL_DOMAIN}</a>) coleta, usa e protege as suas
          informações quando você utiliza o nosso aplicativo de gestão financeira pessoal.
        </p>

        <h2>1. Informações que coletamos</h2>
        <ul>
          <li>
            <strong>Dados de conta:</strong> ao entrar com o Google, recebemos seu nome,
            endereço de e-mail e foto de perfil por meio dos escopos{' '}
            <code>openid</code>, <code>email</code> e <code>profile</code>. Não solicitamos
            acesso a nenhum outro dado da sua conta Google.
          </li>
          <li>
            <strong>Dados financeiros fornecidos por você:</strong> recibos, contas,
            categorias, valores e demais informações que você adiciona ao aplicativo.
          </li>
          <li>
            <strong>Dados técnicos:</strong> informações básicas de uso necessárias para o
            funcionamento e a segurança do serviço.
          </li>
        </ul>

        <h2>2. Como usamos as informações</h2>
        <ul>
          <li>Autenticar o seu acesso e manter a sua sessão.</li>
          <li>Fornecer as funcionalidades de gestão financeira do aplicativo.</li>
          <li>Garantir a segurança da conta e prevenir fraudes.</li>
          <li>Processar a assinatura do serviço, quando aplicável.</li>
        </ul>
        <p>
          <strong>Não vendemos</strong> os seus dados pessoais e não os usamos para
          publicidade.
        </p>

        <h2>3. Compartilhamento de dados</h2>
        <p>
          Compartilhamos dados apenas com provedores estritamente necessários para operar o
          serviço, tais como:
        </p>
        <ul>
          <li><strong>Google</strong> — autenticação (login OAuth 2.0).</li>
          <li><strong>Supabase</strong> — autenticação e banco de dados.</li>
          <li><strong>Stripe</strong> — processamento de pagamentos da assinatura.</li>
        </ul>
        <p>
          O uso das informações recebidas das APIs do Google obedece à{' '}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Política de Dados do Usuário dos Serviços de API do Google
          </a>
          , incluindo os requisitos de Uso Limitado.
        </p>

        <h2>4. Armazenamento e segurança</h2>
        <p>
          Os dados são armazenados de forma criptografada em provedores seguros. Adotamos
          medidas técnicas e organizacionais razoáveis para proteger as suas informações
          contra acesso não autorizado.
        </p>

        <h2>5. Retenção e exclusão</h2>
        <p>
          Mantemos os seus dados enquanto a sua conta estiver ativa. Você pode solicitar a
          exclusão da sua conta e dos dados associados a qualquer momento, entrando em
          contato pelo e-mail abaixo.
        </p>

        <h2>6. Seus direitos</h2>
        <p>
          Você pode acessar, corrigir ou excluir os seus dados pessoais e revogar o acesso
          concedido ao login do Google a qualquer momento em{' '}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
          >
            myaccount.google.com/permissions
          </a>
          .
        </p>

        <h2>7. Contato</h2>
        <p>
          Em caso de dúvidas sobre esta Política de Privacidade, entre em contato:{' '}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>

        <p className="mt-8">
          <Link to={ROUTES.terms} className="text-blue-600 hover:text-blue-500">
            Ver Termos de Serviço
          </Link>
        </p>
      </main>
    </div>
  );
}
