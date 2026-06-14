import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ROUTES } from '../config/site';

/**
 * OAuth redirect target (Supabase sends the user here after Google login).
 *
 * The Supabase client is configured with `detectSessionInUrl: true`, so it
 * automatically parses the auth code/tokens from the URL. We just wait for the
 * session to be ready and then forward the user into the app.
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const finish = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!isMounted) return;

        if (data.session) {
          navigate(ROUTES.app, { replace: true });
        } else {
          // No session yet — wait for Supabase to finish processing the URL.
          const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
              sub.subscription.unsubscribe();
              navigate(ROUTES.app, { replace: true });
            }
          });
          // Fallback: if nothing arrives shortly, send the user back to login.
          setTimeout(() => {
            if (isMounted) {
              sub.subscription.unsubscribe();
              navigate(ROUTES.login, { replace: true });
            }
          }, 5000);
        }
      } catch (err: any) {
        if (isMounted) setError(err?.message ?? 'Authentication failed.');
      }
    };

    finish();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {error ? (
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(ROUTES.login, { replace: true })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Voltar ao login
          </button>
        </div>
      ) : (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      )}
    </div>
  );
}
