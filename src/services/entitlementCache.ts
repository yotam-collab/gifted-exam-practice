/**
 * Offline-tolerant entitlement cache. On a successful entitlement fetch we
 * store {kitIds, userId, fetchedAt} in localStorage. If a later fetch fails
 * (offline, Supabase down), we serve the cache for up to TTL days so a paying
 * family keeps their access on a train / weak connection. Free practice never
 * depends on this — only paid-gate launches do.
 */
const CACHE_KEY = 'entitlementCache';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days grace

interface CacheShape {
  userId: string;
  kitIds: string[];
  fetchedAt: number;
}

export function writeEntitlementCache(userId: string, kitIds: string[]): void {
  try {
    const payload: CacheShape = { userId, kitIds, fetchedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode — cache is best-effort */
  }
}

/** Returns cached kit ids for this user if the cache is fresh, else null. */
export function readEntitlementCache(userId: string): string[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheShape;
    if (parsed.userId !== userId) return null;
    if (Date.now() - parsed.fetchedAt > TTL_MS) return null;
    return parsed.kitIds;
  } catch {
    return null;
  }
}

export function clearEntitlementCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}
