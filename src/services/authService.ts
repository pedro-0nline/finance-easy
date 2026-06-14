/**
 * Authentication service.
 *
 * Single place that owns all auth operations so UI components don't talk to
 * Supabase directly. This keeps responsibilities separated:
 *   - components/pages  -> render + collect input
 *   - services/auth     -> auth business logic
 *   - lib/supabase      -> low-level client
 */
import { supabase } from '../lib/supabase';
import { GOOGLE_OAUTH_SCOPES, OAUTH_REDIRECT_URL } from '../config/site';

/**
 * Start the Google OAuth 2.0 login flow.
 *
 * Requests only the minimal scopes (openid, email, profile) required for
 * Google verification. The user is redirected to Google and, after consent,
 * back to OAUTH_REDIRECT_URL where the session is established.
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: OAUTH_REDIRECT_URL,
      scopes: GOOGLE_OAUTH_SCOPES,
      queryParams: {
        // Always show the account chooser; avoids silently reusing a session.
        prompt: 'select_account',
      },
    },
  });

  if (error) throw error;
  return data;
}

/** Email + password sign in. */
export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Email + password sign up (with optional account metadata). */
export async function signUp(
  email: string,
  password: string,
  metadata?: Record<string, unknown>
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  if (error) throw error;
  return data;
}

/** Update the current user's password. */
export async function updatePassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return data;
}

/** Sign the current user out. */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Get the current session (or null). */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
