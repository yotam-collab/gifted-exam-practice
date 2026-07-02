import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { getCategory, type LibraryItem } from '../config/library';
import { storage } from '../services/storage';
import { useCurrentUserId } from './currentUser';
import { buildAdaptive, buildFullExam, buildMiniExam, buildPractice } from './sessionLaunch';
import { SECTION_CONFIGS } from '../config/sections';
import { useEntitlement } from '../hooks/useEntitlement';
import type { SectionType } from '../types';

/** Small lock/free badge — gating turns real at build step 6. */
function AccessBadge({ access }: { access: 'free' | 'paid' }) {
  return access === 'free' ? (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30 font-bold">חינם</span>
  ) : (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/30 font-bold">🔒 בערכה</span>
  );
}

const KIND_LABEL: Record<LibraryItem['kind'], string> = {
  practice: 'תרגול',
  exam: 'סימולציה',
  guide: 'מדריך',
  printable: 'להדפסה',
  game: 'משחק',
  report: 'מעקב',
};

export default function CategoryRoute() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const userId = useCurrentUserId();
  const category = categoryId ? getCategory(categoryId) : undefined;
  const { isEntitled } = useEntitlement();

  if (!category) return <Navigate to="/library" replace />;

  const stats = storage.getSkillStats(userId);
  const masteryOf = (skillTag?: string) =>
    skillTag ? Math.round(stats.find(s => s.skillTag === skillTag)?.masteryScore ?? 0) : 0;

  const launchItem = (item: LibraryItem) => {
    // Gate: locked paid items route to the paywall instead of launching.
    if (item.access === 'paid' && !isEntitled) {
      return navigate(`/paywall?item=${encodeURIComponent(item.titleHe)}`);
    }
    switch (item.kind) {
      case 'exam': {
        if (item.examKind === 'full') return navigate('/session', { state: buildFullExam() });
        if (item.examKind === 'mini') return navigate('/exam');
        // single-section simulation: one random section under real exam timing
        const section = SECTION_CONFIGS[Math.floor(Math.random() * SECTION_CONFIGS.length)];
        return navigate('/session', { state: buildMiniExam([section.type as SectionType], 0, true) });
      }
      case 'game':
        if (item.route === 'adaptive') return navigate('/session', { state: buildAdaptive() });
        if (item.route === 'daily') {
          const section = SECTION_CONFIGS[new Date().getDay() % SECTION_CONFIGS.length];
          return navigate('/session', { state: buildPractice(section.type as SectionType, 'adaptive', 5, 'per_question') });
        }
        return item.route && navigate(item.route);
      case 'report':
        return item.route && navigate(item.route);
      case 'guide':
        return navigate(`/guides/${item.guideId}`);
      case 'printable':
        return navigate(`/print/${item.sectionType}${item.skillTag ? `.${item.skillTag}` : ''}`);
      case 'practice':
        return navigate('/session', {
          state: buildPractice(item.sectionType!, 'adaptive', 20, 'per_question', item.skillTag),
        });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 page-enter">
      <div className="flex items-center gap-3 mb-1">
        <Link to="/library" className="text-primary-light no-underline text-xl">→</Link>
        <h1 className="text-2xl font-extrabold text-glow">{category.icon} {category.titleHe}</h1>
      </div>
      <p className="text-text-secondary text-sm mb-6 mr-8">{category.descHe}</p>

      {/* Category-level items (guides / simulations / printables / games) */}
      {category.items && category.items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {category.items.map(item => (
            <button
              key={item.id}
              onClick={() => launchItem(item)}
              className="game-card card-hover p-4 text-right cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-text-secondary">{KIND_LABEL[item.kind]}</span>
                <AccessBadge access={item.access} />
              </div>
              <div className="font-bold text-text">{item.titleHe}</div>
              {item.descHe && <div className="text-xs text-text-secondary mt-1 leading-snug">{item.descHe}</div>}
            </button>
          ))}
        </div>
      )}

      {/* Subtopics (the 44 skills, for practice-domain categories) */}
      {category.subtopics.length > 0 && (
        <>
          <h2 className="text-base font-semibold text-text-secondary mb-3">תתי-נושאים:</h2>
          <div className="flex flex-col gap-2">
            {category.subtopics.map(sub => {
              const mastery = masteryOf(sub.skillTag);
              const practiceItem = sub.items.find(i => i.kind === 'practice');
              return (
                <Link
                  key={sub.id}
                  to={`/library/${category.id}/${sub.id}`}
                  className="game-card card-hover px-4 py-3 no-underline flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text truncate">{sub.titleHe}</span>
                      {practiceItem && <AccessBadge access={practiceItem.access} />}
                    </div>
                    <div className="progress-track h-1.5 mt-2 max-w-xs">
                      <div className="progress-fill h-full rounded-full" style={{ width: `${mastery}%` }} />
                    </div>
                  </div>
                  <div className="text-xs text-text-secondary shrink-0">שליטה {mastery}%</div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
