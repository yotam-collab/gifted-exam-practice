import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { STAGE_B_KIT } from '../../config/library';
import { storage } from '../../services/storage';
import { useCurrentUserId } from '../../routes/currentUser';
import { SECTION_CONFIGS } from '../../config/sections';

/**
 * Desktop shell — persistent right-side (RTL) sidebar + topbar at lg and up.
 * Below lg the existing mobile flows render untouched inside <Outlet/>.
 * Full-bleed routes (/session, /print, /auth/callback) are mounted OUTSIDE
 * this layout in the router.
 */

/** Overall progress ring — v1 shows mastery coverage across all 44 skills.
 *  (The full formula — plan-task completion + last simulation score — joins
 *  when the personal plan engine lands.) */
function useMasteryCoverage(userId: string): number {
  const stats = storage.getSkillStats(userId);
  const totalSkills = SECTION_CONFIGS.reduce((sum, s) => sum + s.skills.length, 0);
  if (totalSkills === 0) return 0;
  const sum = stats.reduce((acc, s) => acc + s.masteryScore, 0);
  return Math.round(sum / totalSkills);
}

function ProgressRing({ percent }: { percent: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const filled = (percent / 100) * c;
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" className="shrink-0">
      <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(92,61,30,0.6)" strokeWidth="7" />
      <circle
        cx="38" cy="38" r={r} fill="none"
        stroke="url(#ringGrad)" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={`${filled} ${c - filled}`}
        transform="rotate(-90 38 38)"
      />
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E85D3A" />
          <stop offset="100%" stopColor="#F39C12" />
        </linearGradient>
      </defs>
      <text x="38" y="38" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="800" fill="#FFF5E4">
        {percent}%
      </text>
    </svg>
  );
}

function daysToExam(examDate?: string): number | null {
  if (!examDate) return null;
  const target = new Date(examDate + 'T00:00:00');
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
  return diff >= 0 ? diff : null;
}

export default function AppShell() {
  const userId = useCurrentUserId();
  const settings = storage.getSettings();
  const progress = useMasteryCoverage(userId);
  const days = daysToExam(settings.examDate);
  const location = useLocation();

  return (
    <div className="lg:grid lg:grid-cols-[280px_1fr] min-h-screen">
      {/* Sidebar — hidden on mobile, sticky on desktop. In RTL grid the first
          column lands on the RIGHT automatically. */}
      <aside className="hidden lg:flex flex-col gap-5 border-l border-border/60 bg-bg-light/40 px-5 py-6 sticky top-0 h-screen overflow-y-auto">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 no-underline">
          <span className="text-3xl">🍉</span>
          <div>
            <div className="text-lg font-extrabold text-glow leading-tight">זינוק מחוננים</div>
            <div className="text-[11px] text-text-secondary leading-tight">{STAGE_B_KIT.titleHe}</div>
          </div>
        </Link>

        {/* Learning plan block */}
        <div className="game-card p-4 flex items-center gap-3">
          <ProgressRing percent={progress} />
          <div className="min-w-0">
            <div className="text-sm font-bold">ההתקדמות שלנו</div>
            {days !== null ? (
              <div className="text-xs text-text-secondary mt-1">
                <span className="text-warning font-bold">{days}</span> ימים למבחן
              </div>
            ) : (
              <div className="text-xs text-text-secondary mt-1">הגדירו תאריך מבחן בלוח ההורים</div>
            )}
          </div>
        </div>

        {/* Library CTA */}
        <NavLink
          to="/library"
          className={({ isActive }) =>
            `btn-game text-center text-base py-3 no-underline ${isActive ? 'ring-2 ring-warning/60' : ''}`
          }
        >
          📚 ספריית התרגול
        </NavLink>

        {/* Category nav */}
        <nav className="flex flex-col gap-1">
          {STAGE_B_KIT.categories.map(cat => (
            <NavLink
              key={cat.id}
              to={`/library/${cat.id}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-sm no-underline transition-colors ${
                  isActive
                    ? 'bg-primary/15 text-primary-light font-bold border border-primary/30'
                    : 'text-text-secondary hover:bg-card hover:text-text'
                }`
              }
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="truncate">{cat.titleHe}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <NavLink
            to="/parent-login"
            className="text-center text-xs text-text-secondary hover:text-primary-light no-underline py-2"
          >
            🔒 אזור הורים
          </NavLink>
        </div>
      </aside>

      {/* Main column */}
      <div className="min-w-0">
        {/* Topbar — desktop only; mobile keeps each screen's own header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-border/40">
          <div className="text-sm text-text-secondary">
            שלום, <b className="text-text">{settings.childName}</b> 👋
          </div>
          <div className="flex items-center gap-3 text-xs text-text-secondary">
            {/* Kit validity tag — real expiry arrives with entitlements (step 6) */}
            <span className="px-3 py-1 rounded-full bg-card border border-border/60">
              {location.pathname.startsWith('/library') ? 'ספריית התרגול' : 'ערכת הכנה פעילה'}
            </span>
          </div>
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
