/**
 * ⚠️ SECURITY — CRITICAL ⚠️
 * A private Anthropic API key was hardcoded here and is bundled into the public
 * frontend (anyone can read it from the browser). This key is COMPROMISED.
 *
 * REQUIRED ACTIONS:
 *   1. Revoke/rotate this key now at https://console.anthropic.com/settings/keys
 *   2. Move all Anthropic calls to a backend (e.g. a Supabase Edge Function)
 *      and keep the new key server-side only — never in frontend/VITE_ code.
 *
 * The value is read from an env var so it is no longer hardcoded. Until the
 * calls are moved to a backend, set ANTHROPIC_API_KEY locally if needed.
 */
export const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY ?? '';