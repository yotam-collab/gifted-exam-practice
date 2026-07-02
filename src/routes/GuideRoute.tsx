import { Link, useParams } from 'react-router';

/**
 * Guide renderer — placeholder until build step 10 lands the TSX guide
 * content system (src/content/guides/*). Keeps library links alive.
 */
export default function GuideRoute() {
  const { guideId } = useParams();
  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-10 page-enter text-center">
      <div className="text-6xl mb-4">📖</div>
      <h1 className="text-2xl font-extrabold text-glow mb-2">המדריך בדרך אליכם</h1>
      <p className="text-text-secondary text-sm mb-6">
        המדריך "{guideId}" ייפתח כאן ממש בקרוב.
      </p>
      <Link to="/library" className="btn-game inline-block px-6 py-3 no-underline">
        חזרה לספרייה
      </Link>
    </div>
  );
}
