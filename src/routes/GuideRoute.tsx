import { Link, Navigate, useParams } from 'react-router';
import { getGuide } from '../content/guides';

/** Renders an authored TSX guide by id. Guides can embed live diagrams. */
export default function GuideRoute() {
  const { guideId } = useParams();
  const guide = guideId ? getGuide(guideId) : undefined;

  if (!guide) {
    // Unknown guide id (e.g. a section without an authored strategy guide yet)
    return (
      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-10 page-enter text-center">
        <div className="text-6xl mb-4">📖</div>
        <h1 className="text-2xl font-extrabold text-glow mb-2">המדריך בדרך אליכם</h1>
        <p className="text-text-secondary text-sm mb-6">המדריך הזה ייכתב ממש בקרוב.</p>
        <Link to="/library" className="btn-game inline-block px-6 py-3 no-underline">חזרה לספרייה</Link>
      </div>
    );
  }

  return <GuideView guideId={guideId!} />;
}

function GuideView({ guideId }: { guideId: string }) {
  const guide = getGuide(guideId);
  if (!guide) return <Navigate to="/library" replace />;
  const Body = guide.body;
  return (
    <article className="max-w-2xl mx-auto px-4 lg:px-8 py-8 page-enter">
      <div className="flex items-center gap-3 mb-1">
        <Link to="/library" className="text-primary-light no-underline text-xl">→</Link>
        <h1 className="text-2xl font-extrabold text-glow">{guide.titleHe}</h1>
      </div>
      {guide.subtitleHe && <p className="text-text-secondary text-sm mb-6 mr-8">{guide.subtitleHe}</p>}
      <div className="mt-4">
        <Body />
      </div>
      <div className="text-center mt-8">
        <Link to="/library" className="text-sm text-text-secondary hover:text-primary-light no-underline">
          חזרה לספרייה
        </Link>
      </div>
    </article>
  );
}
