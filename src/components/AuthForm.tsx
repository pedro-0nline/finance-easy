import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

import {
  LogIn,
  UserPlus,
  Loader2,
  KeyRound,
  ArrowLeft,
  Briefcase,
  User
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { sendTempPasswordEmail } from '../lib/email';
import { GoogleSignInButton } from './GoogleSignInButton';
import { ROUTES } from '../config/site';

type AuthMode = 'login' | 'signup' | 'reset-password' | 'set-password';

interface AuthFormProps {
  initialMode: AuthMode;
  resetCode?: string | null;
}

export function AuthForm({ initialMode }: AuthFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');

  const getAuthErrorMessage = (message: string) => {
    if (message === 'Invalid login credentials') {
      return 'Invalid email or password. Please try again.';
    }

    if (message.toLowerCase().includes('email not confirmed')) {
      return 'Please confirm your email address before logging in.';
    }

    return message;
  };

  const normalizedEmail = email.trim().toLowerCase();

  // Ao carregar o componente, verifica se há o parâmetro pago=true na URL e se há cadastro pendente
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pago = params.get('pago');
    const pendingSignup = localStorage.getItem('pendingSignup');
    if (pago === 'true' && pendingSignup) {
      const { email, password, accountType } = JSON.parse(pendingSignup);
      // Tenta efetuar o cadastro via Supabase
      (async () => {
        setIsLoading(true);
        try {
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { account_type: accountType }
            }
          });
          if (signUpError) {
            setError(signUpError.message);
          } else {
            setSuccessMessage(t('auth.accountCreated', 'Conta criada com sucesso!'));
            localStorage.removeItem('pendingSignup');
            // Redireciona para a tela de login ou dashboard, conforme sua lógica
            navigate('/', { replace: true });
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [navigate, t]);

  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (mode === 'reset-password') {
        // Envia a senha temporária para o email
        await sendTempPasswordEmail(normalizedEmail);
        setSuccessMessage('A temporary password has been sent to your email.');
        setTimeout(() => {
          setMode('login');
        }, 2000);
      } else if (mode === 'set-password') {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setSuccessMessage('Your password has been updated. Please sign in.');
        setPassword('');
        setTimeout(() => {
          setMode('login');
        }, 1500);
      } else if (mode === 'signup') {
        // Salva os dados de cadastro pendente no local storage
        localStorage.setItem(
          'pendingSignup',
          JSON.stringify({ email: normalizedEmail, password, accountType })
        );
        // Redireciona para o Stripe Checkout com o email pré-preenchido
        window.location.href = `https://buy.stripe.com/9AQdU39Br5GxgNy001?prefilled_email=${encodeURIComponent(normalizedEmail)}`;
      } else if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });
        if (signInError) {
          throw new Error(getAuthErrorMessage(signInError.message));
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">
          {mode === 'reset-password'
            ? t('auth.resetPassword')
            : mode === 'set-password'
            ? t('auth.setPassword', 'Set New Password')
            : mode === 'signup'
            ? t('auth.signup')
            : t('auth.login')}
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
            {successMessage}
          </div>
        )}

        {(mode === 'login' || mode === 'signup') && (
          <div className="mb-4 space-y-4">
            <GoogleSignInButton onError={setError} />
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-gray-200" />
              <span className="text-xs uppercase tracking-wide text-gray-400">
                {t('auth.orContinueWithEmail', 'ou continue com e-mail')}
              </span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setAccountType('personal')}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                    accountType === 'personal'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <User className={`w-6 h-6 mb-2 ${accountType === 'personal' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${accountType === 'personal' ? 'text-blue-700' : 'text-gray-600'}`}>
                    Personal
                  </span>
                </button>
                <div className="relative">
                  <button
                    type="button"
                    disabled
                    className="w-full flex flex-col items-center justify-center p-4 rounded-lg border-2 border-gray-200 opacity-50 cursor-not-allowed"
                  >
                    <Briefcase className="w-6 h-6 mb-2 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">
                      Business
                    </span>
                  </button>
                  <div className="absolute -top-3 right-0 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Coming Soon
                  </div>
                </div>
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'signup' || mode === 'reset-password') && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('auth.email')}
              </label>
              <input
                type="email"
                id="auth-email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearMessages();
                }}
                autoComplete="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {(mode === 'login' || mode === 'signup' || mode === 'set-password') && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('auth.password')}
              </label>
              <input
                type="password"
                id={mode === 'set-password' ? 'set-password' : 'auth-password'}
                name={mode === 'signup' || mode === 'set-password' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearMessages();
                }}
                autoComplete={mode === 'signup' || mode === 'set-password' ? 'new-password' : 'current-password'}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                minLength={6}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : mode === 'reset-password' ? (
              <>
                <KeyRound className="h-5 w-5 mr-2" />
                {t('auth.sendTemporaryPassword')}
              </>
            ) : mode === 'set-password' ? (
              <>
                <KeyRound className="h-5 w-5 mr-2" />
                {t('auth.setPassword', 'Set New Password')}
              </>
            ) : mode === 'signup' ? (
              <>
                <UserPlus className="h-5 w-5 mr-2" />
                {t('auth.signup')}
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5 mr-2" />
                {t('auth.login')}
              </>
            )}
          </button>
        </form>

        {mode !== 'set-password' && (
          <div className="mt-4 flex flex-col space-y-2">
            {mode === 'reset-password' ? (
              <button
                onClick={() => {
                  setMode('login');
                  clearMessages();
                  navigate('/', { replace: true });
                }}
                className="flex items-center justify-center text-sm text-blue-600 hover:text-blue-500"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t('auth.backToLogin')}
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMode(mode === 'signup' ? 'login' : 'signup');
                    clearMessages();
                  }}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  {mode === 'signup' ? t('auth.alreadyHaveAccount') : t('auth.needAccount')}
                </button>
                <button
                  onClick={() => {
                    setMode('reset-password');
                    clearMessages();
                  }}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  {t('auth.forgotPassword')}
                </button>
              </>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          <Link to={ROUTES.privacy} className="hover:text-gray-600 underline">
            {t('legal.privacyPolicy', 'Política de Privacidade')}
          </Link>
          <span className="mx-2">·</span>
          <Link to={ROUTES.terms} className="hover:text-gray-600 underline">
            {t('legal.termsOfService', 'Termos de Serviço')}
          </Link>
        </p>
      </div>
    </div>
  );
}
