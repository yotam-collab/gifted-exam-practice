import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client — created lazily so the app still boots (in local-only /
 * offline mode) when env vars are absent. Every caller must handle a null
 * client: auth and entitlement layers degrade to "anonymous / free practice"
 * rather than crashing.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const KIT_ID = (import.meta.env.VITE_KIT_ID as string | undefined) ?? 'stage-b-grade2';

export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  client = createClient(url!, anonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // handles the magic-link hash on /auth/callback
      flowType: 'pkce',
    },
  });
}

export const supabase = client;
