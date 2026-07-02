import { useEffect, useState } from 'react';
import { supabase, KIT_ID } from '../lib/supabase';
import { useAuth } from './useAuth';
import { readEntitlementCache, writeEntitlementCache } from '../services/entitlementCache';

export type EntitlementStatus =
  | 'loading'
  | 'entitled'      // owns the kit (paid), not expired
  | 'free_only'     // logged in, no kit — free tier
  | 'anonymous';    // not logged in (and Supabase configured) — free tier

/**
 * Single source of truth for "can this user open paid content?".
 * - Supabase not configured (local dev / offline build): everyone is treated
 *   as `entitled` so the app is fully usable without a backend.
 * - Configured + logged in: query entitlements for the kit; fall back to the
 *   7-day cache if the network fails.
 */
export function useEntitlement(kitId: string = KIT_ID): {
  status: EntitlementStatus;
  isEntitled: boolean;
  refresh: () => void;
} {
  const { user, loading: authLoading, localOnly } = useAuth();
  const [status, setStatus] = useState<EntitlementStatus>('loading');
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    // Local-only mode: no gate.
    if (localOnly) {
      setStatus('entitled');
      return;
    }
    if (authLoading) {
      setStatus('loading');
      return;
    }
    if (!user) {
      setStatus('anonymous');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    (async () => {
      try {
        const nowIso = new Date().toISOString();
        const { data, error } = await supabase!
          .from('entitlements')
          .select('kit_id, expires_at')
          .eq('kit_id', kitId)
          .or(`expires_at.is.null,expires_at.gt.${nowIso}`);
        if (error) throw error;
        const entitled = (data ?? []).length > 0;
        if (cancelled) return;
        writeEntitlementCache(user.id, entitled ? [kitId] : []);
        setStatus(entitled ? 'entitled' : 'free_only');
      } catch {
        // Network / server failure → trust the cache within its TTL.
        if (cancelled) return;
        const cached = readEntitlementCache(user.id);
        if (cached && cached.includes(kitId)) setStatus('entitled');
        else setStatus('free_only');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, localOnly, kitId, nonce]);

  return {
    status,
    isEntitled: status === 'entitled',
    refresh: () => setNonce((n) => n + 1),
  };
}
