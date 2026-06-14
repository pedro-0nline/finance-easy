/**
 * Central site & OAuth configuration.
 *
 * Single source of truth for the official domain, public routes and the
 * Google OAuth settings required for the Google verification process.
 *
 * IMPORTANT (Google OAuth + Supabase):
 * - The Google `client_id` / `client_secret` are configured in the Supabase
 *   dashboard (Authentication > Providers > Google), NEVER in this frontend.
 * - The `redirect_uri` that must be registered in Google Cloud Console is the
 *   Supabase callback, NOT the URLs below:
 *       https://<your-project-ref>.supabase.co/auth/v1/callback
 * - The URLs below are the "Site URL" / "Redirect URLs" you register in
 *   Supabase (Authentication > URL Configuration) so Supabase is allowed to
 *   send the user back to this app after a successful login.
 */

/** Official production domain (no trailing slash). */
export const OFFICIAL_DOMAIN = 'https://finance.pedropaulocf.com.br';

/**
 * Base URL used to build OAuth redirect targets.
 *
 * - In the browser we use the real origin so the flow works in every
 *   environment (localhost, preview, production) without code changes.
 * - `VITE_SITE_URL` can force a specific base (e.g. during SSR/build tooling).
 * - Falls back to the official domain as a last resort.
 */
export const SITE_URL: string =
  import.meta.env.VITE_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : OFFICIAL_DOMAIN);

/** Application route paths (keep in sync with the router in App.tsx). */
export const ROUTES = {
  home: '/',
  login: '/login',
  app: '/app',
  authCallback: '/auth/callback',
  privacy: '/privacy',
  terms: '/terms',
} as const;

/**
 * Where Supabase sends the user back after Google completes authentication.
 * This URL must be listed in Supabase > Authentication > URL Configuration.
 */
export const OAUTH_REDIRECT_URL = `${SITE_URL}${ROUTES.authCallback}`;

/**
 * Minimal OAuth scopes required by Google verification.
 * Only request what the app actually needs: identity + basic profile + email.
 */
export const GOOGLE_OAUTH_SCOPES = 'openid email profile';
