import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { getCategory, getSubtopic } from '../config/library';
import { storage } from '../services/storage';
import { useCurrentUserId } from './currentUser';
import { buildPractice } from './sessionLaunch';
import { useEntitlement } from '../hooks/useEntitlement';
import type { Difficulty } from '../types';

/**
 * Skill launcher page — the Level-3 view: explanation, quick-launch practice
 * with difficulty choice, printable download, and recent history in this
 * specific skill.
 */
export default function SubtopicRoute() {
  const { categoryId, subtopicId } = useParams();
  const navigate = useNavigate();
  const userId = useCurrentUserId();

  const category = categoryId ? getCategory(categoryId) : undefined;
  const subtopic = categoryId && subtopicId ? getSubtopic(categoryId, subtopicId) : undefined;
  const { isEntitled } = useEntitlement();

  if (!category || !subtopic || !subtopic.sectionType || !subtopic.skillTag) {
    return <Navigate to={category ? `/library/${category.id}` : '/library'} replace />;
  }

  // A skill is paid if its practice item is; locked skills paywall on launch.
  const practiceItem = subtopic.items.find(i => i.kind === 'practice');
  const locked = practiceItem?.access === 'paid' && !isEntitled;

  const stat = storage
    .getSkillStats(userId)
    .find(s => s.skillTag === subtopic.skillTag);
  const mastery = Math.round(stat?.masteryScore ?? 0);
  const attempts = stat?.attempts ?? 0;
  const correct = stat?.correctCount ?? 0;

  const launch = (difficulty: Difficulty, count: number) => {
    if (locked) return navigate(`/paywall?item=${encodeURIComponent(subtopic.titleHe)}`);
    navigate('/session', {
      state: buildPractice(subtopic.sectionType!, difficulty, count, 'per_question', subtopic.skillTag),
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 page-enter">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/library/${category.id}`} className="text-primary-light no-underline text-xl">→</Link>
        <div>
          <div className="text-xs text-text-secondary">{category.icon} {category.titleHe}</div>
          <h1 className="text-2xl font-extrabold text-glow">{subtopic.titleHe}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        {/* Launcher */}
        <div className="flex flex-col gap-4">
          <div className="game-card p-5">
            <h2 className="font-bold mb-3">🎯 תרגול מהיר</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={() => launch('adaptive', 10)} className="btn-game py-3 text-sm cursor-pointer">
                סט קצר (10)
              </button>
              <button onClick={() => launch('adaptive', 20)} className="btn-game py-3 text-sm cursor-pointer">
                סט מלא (20)
              </button>
              <button onClick={() => launch('hard', 10)} className="btn-game btn-game-success py-3 text-sm cursor-pointer">
                אתגר קשה (10)
              </button>
            </div>
            <p className="text-xs text-text-secondary mt-3">
              כל סט נוצר מחדש ברגע הלחיצה — אי אפשר "לגמור" את השאלות.
            </p>
          </div>

          <div className="game-card p-5">
            <h2 className="font-bold mb-2">🖨️ דף עבודה להדפסה</h2>
            <p className="text-xs text-text-secondary mb-3">
              דף עבודה מודפס במיומנות הזו, עם דף תשובות נפרד להורים.
            </p>
            <button
              onClick={() => navigate(`/print/${subtopic.sectionType}.${subtopic.skillTag}`)}
              className="px-4 py-2 rounded-xl bg-card border border-border text-sm cursor-pointer hover:border-primary/40 transition-colors"
            >
              יצירת דף עבודה
            </button>
          </div>
        </div>

        {/* Skill stats */}
        <div className="game-card p-5 h-fit">
          <h2 className="font-bold mb-3">📊 המצב שלנו כאן</h2>
          <div className="mb-3">
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>שליטה</span>
              <span className="font-bold text-text">{mastery}%</span>
            </div>
            <div className="progress-track h-2">
              <div className="progress-fill h-full rounded-full" style={{ width: `${mastery}%` }} />
            </div>
          </div>
          <div className="text-xs text-text-secondary space-y-1">
            <div>שאלות שנענו: <b className="text-text">{attempts}</b></div>
            <div>תשובות נכונות: <b className="text-success">{correct}</b></div>
            {attempts > 0 && (
              <div>אחוז הצלחה: <b className="text-text">{Math.round((correct / attempts) * 100)}%</b></div>
            )}
            {attempts === 0 && <div className="text-warning">עוד לא תרגלנו כאן — זה הזמן! 🚀</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
