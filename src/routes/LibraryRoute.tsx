import { Link } from 'react-router';
import { STAGE_B_KIT, subtopicCount } from '../config/library';

/** Library home — grid of the 8 category cards. Locked items stay VISIBLE
 *  (lock badge) per the product rule: never hide, always tease. */
export default function LibraryRoute() {
  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 page-enter">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-glow mb-1">ספריית התרגול</h1>
        <p className="text-text-secondary text-sm">
          כל התכנים של {STAGE_B_KIT.titleHe} — מסודרים לפי תחומים.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {STAGE_B_KIT.categories.map((cat, i) => (
          <Link
            key={cat.id}
            to={`/library/${cat.id}`}
            className="game-card card-hover p-5 no-underline cascade-item"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">{cat.icon}</div>
              <div className="min-w-0">
                <div className="text-lg font-bold text-text mb-1">{cat.titleHe}</div>
                <div className="text-sm text-text-secondary leading-snug mb-2">{cat.descHe}</div>
                <div className="text-xs text-primary-light font-semibold">
                  {subtopicCount(cat)} {cat.subtopics.length > 0 ? 'תתי-נושאים' : 'פריטים'}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
