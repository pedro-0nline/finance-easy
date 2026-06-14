import { createClient } from '@supabase/supabase-js';

/**
 * Front-end client configuration:
 * - This app runs in the browser and needs Supabase HTTP endpoint + anon key.
 * - If a postgres:// URL is provided (legacy setup), we try to derive the API URL.
 */
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!rawSupabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing front-end database config. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

const resolveSupabaseApiUrl = (urlValue: string): string => {
  if (!urlValue.startsWith('postgres://') && !urlValue.startsWith('postgresql://')) {
    return urlValue;
  }

  const parsedDbUrl = new URL(urlValue);
  let projectRef: string | null = null;

  const dbHostMatch = parsedDbUrl.hostname.match(/^db\.([a-z0-9-]+)\.supabase\.co$/i);
  if (dbHostMatch?.[1]) {
    projectRef = dbHostMatch[1];
  }

  if (!projectRef && parsedDbUrl.username) {
    const username = decodeURIComponent(parsedDbUrl.username);
    const usernameMatch = username.match(/^[^.]+\.([a-z0-9-]+)$/i);
    if (usernameMatch?.[1]) {
      projectRef = usernameMatch[1];
    }
  }

  if (!projectRef) {
    throw new Error(
      'Detected postgres URL in VITE_SUPABASE_URL, but could not infer the Supabase project ref. Set VITE_SUPABASE_URL to https://<project-ref>.supabase.co.'
    );
  }

  return `https://${projectRef}.supabase.co`;
};

const supabaseUrl = resolveSupabaseApiUrl(rawSupabaseUrl);
const parsedSupabaseUrl = new URL(supabaseUrl);
const supabaseProjectRef = parsedSupabaseUrl.hostname.split('.')[0];

if (!parsedSupabaseUrl.hostname.endsWith('.supabase.co')) {
  throw new Error('VITE_SUPABASE_URL must point to a *.supabase.co host.');
}

const fetchWithDiagnostics: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(
        `Unable to reach Supabase at ${parsedSupabaseUrl.hostname}. Check DNS resolution and confirm your Supabase project URL is correct.`
      );
    }

    throw error;
  }
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error('Error accessing localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Error setting localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      }
    }
  },
  global: {
    fetch: fetchWithDiagnostics,
    headers: { 'x-client-info': 'finance-manager@1.0.0' }
  }
});

const clearAuthState = () => {
  try {
    const storageKey = `sb-${supabaseProjectRef}`;
    localStorage.removeItem(`${storageKey}-auth-token`);
    localStorage.removeItem(`${storageKey}-pkce-verifier`);

    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Error clearing auth state:', error);
  }
};

const initAuth = async () => {
  try {
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    if (!session) {
      const storageKey = `sb-${supabaseProjectRef}`;
      const hasStoredSession = localStorage.getItem(`${storageKey}-auth-token`);

      if (hasStoredSession) {
        clearAuthState();
      }
    }
  } catch (err) {
    console.error('Auth initialization error:', err);
    clearAuthState();
  }
};

initAuth().catch(console.error);

export const checkSupabaseConnection = async () => {
  try {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) return false;

    const { error } = await supabase.from('subscriptions').select('count');
    return !error;
  } catch {
    return false;
  }
};
