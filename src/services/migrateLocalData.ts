/**
 * One-time local-data migration. Before auth, all practice data lived in the
 * unsuffixed localStorage keys under userId 'child_itamar'. On a parent's
 * first login we copy those records into the new `::<uid>` namespace and
 * rewrite their userId field to the Supabase uid — non-destructively (the
 * originals stay, so an anonymous session still sees them).
 */
import type { Session, SkillStats, Recommendation } from '../types';
import { storage } from './storage';

const LEGACY_USER_ID = 'child_itamar';

function migratedFlagKey(uid: string): string {
  return `migrated::${uid}`;
}

export function migrateLegacyDataToUser(uid: string): void {
  if (!uid || uid === 'local') return;
  const flag = migratedFlagKey(uid);
  try {
    if (localStorage.getItem(flag)) return; // already migrated
  } catch {
    return;
  }

  // Read from the UNSUFFIXED (anonymous) namespace directly — bypass the
  // active-user key builder so we always read the legacy space.
  const readLegacy = <T>(key: string): T[] => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  };

  const legacySessions = readLegacy<Session>(storage.KEYS.sessions).filter(s => s.userId === LEGACY_USER_ID);
  const legacyStats = readLegacy<SkillStats>(storage.KEYS.skillStats).filter(s => s.userId === LEGACY_USER_ID);
  const legacyRecs = readLegacy<Recommendation>(storage.KEYS.recommendations).filter(r => r.userId === LEGACY_USER_ID);

  // Write into the active (already set to this uid) namespace, rewriting ids.
  if (legacySessions.length) {
    const existing = storage.get<Session[]>(storage.KEYS.sessions, []);
    const remapped = legacySessions.map(s => ({ ...s, userId: uid }));
    const byId = new Map(existing.map(s => [s.id, s]));
    for (const s of remapped) byId.set(s.id, s);
    storage.set(storage.KEYS.sessions, [...byId.values()]);
  }
  if (legacyStats.length) {
    const existing = storage.get<SkillStats[]>(storage.KEYS.skillStats, []);
    const remapped = legacyStats.map(s => ({
      ...s,
      userId: uid,
      id: s.id.replace(LEGACY_USER_ID, uid),
    }));
    const byId = new Map(existing.map(s => [s.id, s]));
    for (const s of remapped) byId.set(s.id, s);
    storage.set(storage.KEYS.skillStats, [...byId.values()]);
  }
  if (legacyRecs.length) {
    const existing = storage.get<Recommendation[]>(storage.KEYS.recommendations, []);
    const remapped = legacyRecs.map(r => ({ ...r, userId: uid }));
    const byId = new Map(existing.map(r => [r.id, r]));
    for (const r of remapped) byId.set(r.id, r);
    storage.set(storage.KEYS.recommendations, [...byId.values()]);
  }

  try {
    localStorage.setItem(flag, '1');
  } catch {
    /* best-effort */
  }
}
