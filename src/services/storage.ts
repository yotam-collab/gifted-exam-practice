import type {
  Session,
  SkillStats,
  SectionType,
  SkillTag,
  Recommendation,
} from '../types';

// === App Settings ===

export interface AppSettings {
  parentPin: string;
  childName: string;
  /** ISO date (yyyy-mm-dd) of the child's exam — powers the countdown + plan. */
  examDate?: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  parentPin: '1234',
  childName: 'איתמר',
};

// === Storage Keys ===

const KEYS = {
  sessions: 'sessions',
  skillStats: 'skillStats',
  recommendations: 'recommendations',
  users: 'users',
  settings: 'settings',
} as const;

// === Per-user namespacing ===
// Anonymous ('local') keeps the original unsuffixed keys — fully backward
// compatible with any existing data. A logged-in Supabase user gets a
// `::<uid>` suffix so multiple accounts on one browser stay isolated.
let activeUserId = 'local';

export function setActiveUserId(id: string | null): void {
  activeUserId = id ?? 'local';
}

export function getActiveUserId(): string {
  return activeUserId;
}

function k(key: string): string {
  return activeUserId === 'local' ? key : `${key}::${activeUserId}`;
}

// === Storage Service ===

export const storage = {
  // Expose the key namespacer so the migration helper can reach both spaces.
  _key: k,
  KEYS,

  // ── Generic helpers ──────────────────────────────────────────────

  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(k(key));
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    localStorage.setItem(k(key), JSON.stringify(value));
  },

  // ── Session helpers ──────────────────────────────────────────────

  getSessions(userId: string): Session[] {
    const all = storage.get<Session[]>(KEYS.sessions, []);
    return all.filter((s) => s.userId === userId);
  },

  saveSession(session: Session): void {
    const all = storage.get<Session[]>(KEYS.sessions, []);
    const idx = all.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      all[idx] = session;
    } else {
      all.push(session);
    }
    storage.set(KEYS.sessions, all);
  },

  // ── Skill Stats helpers ──────────────────────────────────────────

  getSkillStats(userId: string): SkillStats[] {
    const all = storage.get<SkillStats[]>(KEYS.skillStats, []);
    return all.filter((s) => s.userId === userId);
  },

  saveSkillStats(stats: SkillStats): void {
    const all = storage.get<SkillStats[]>(KEYS.skillStats, []);
    const idx = all.findIndex((s) => s.id === stats.id);
    if (idx >= 0) {
      all[idx] = stats;
    } else {
      all.push(stats);
    }
    storage.set(KEYS.skillStats, all);
  },

  getSkillStat(
    userId: string,
    sectionType: SectionType,
    skillTag: SkillTag
  ): SkillStats | undefined {
    const all = storage.get<SkillStats[]>(KEYS.skillStats, []);
    return all.find(
      (s) =>
        s.userId === userId &&
        s.sectionType === sectionType &&
        s.skillTag === skillTag
    );
  },

  // ── Recommendations ──────────────────────────────────────────────

  getRecommendations(userId: string): Recommendation[] {
    const all = storage.get<Recommendation[]>(KEYS.recommendations, []);
    return all.filter((r) => r.userId === userId);
  },

  saveRecommendation(rec: Recommendation): void {
    const all = storage.get<Recommendation[]>(KEYS.recommendations, []);
    const idx = all.findIndex((r) => r.id === rec.id);
    if (idx >= 0) {
      all[idx] = rec;
    } else {
      all.push(rec);
    }
    storage.set(KEYS.recommendations, all);
  },

  // ── Settings ─────────────────────────────────────────────────────

  getSettings(): AppSettings {
    return storage.get<AppSettings>(KEYS.settings, DEFAULT_SETTINGS);
  },

  saveSettings(settings: AppSettings): void {
    storage.set(KEYS.settings, settings);
  },
};
