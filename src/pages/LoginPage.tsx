import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';

/**
 * Login / sign-up page.
 *
 * If the URL carries a `code` query param (Supabase password-recovery link),
 * we render the "set new password" flow instead of the normal login form.
 */
export function LoginPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        {code ? (
          <AuthForm initialMode="set-password" resetCode={code} />
        ) : (
          <AuthForm initialMode="login" resetCode={null} />
        )}
      </div>
      <footer className="py-4 text-center text-sm text-gray-500">
        Powered by WP Solutions 1.0.0
      </footer>
    </div>
  );
}
