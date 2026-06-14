import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { MainApp } from './components/MainApp';
import { LandingPage } from './components/LandingPage';
import { SubscriptionBlocker } from './components/SubscriptionBlocker';
import { LoginPage } from './pages/LoginPage';
import { AuthCallback } from './pages/AuthCallback';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { NotFound } from './pages/NotFound';
import { ROUTES } from './config/site';

/** Full-screen loading spinner. */
function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  );
}

/** Subscribe to the Supabase auth session. */
function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(session);
      } catch (err) {
        console.error('Error getting session:', err);
        await supabase.auth.signOut();
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, isLoading };
}

function AppRoutes() {
  const { session, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) return <FullScreenLoader />;

  // Supabase password-recovery links land on "/" with a `code` query param.
  // Forward them to the login page where the "set new password" form lives.
  const hasRecoveryCode = new URLSearchParams(location.search).has('code');
  if (hasRecoveryCode && location.pathname === ROUTES.home) {
    return <Navigate to={`${ROUTES.login}${location.search}`} replace />;
  }

  return (
    <Routes>
      {/* Public homepage */}
      <Route
        path={ROUTES.home}
        element={session ? <Navigate to={ROUTES.app} replace /> : <LandingPage />}
      />

      {/* Public legal pages (required by Google verification) */}
      <Route path={ROUTES.privacy} element={<PrivacyPolicy />} />
      <Route path={ROUTES.terms} element={<TermsOfService />} />

      {/* Auth */}
      <Route
        path={ROUTES.login}
        element={session ? <Navigate to={ROUTES.app} replace /> : <LoginPage />}
      />
      <Route path={ROUTES.authCallback} element={<AuthCallback />} />

      {/* Protected application */}
      <Route
        path={`${ROUTES.app}/*`}
        element={
          session ? (
            <SubscriptionBlocker>
              <MainApp session={session} />
            </SubscriptionBlocker>
          ) : (
            <Navigate to={ROUTES.login} replace />
          )
        }
      />

      {/* 404 — no broken routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes />
    </Router>
  );
}
