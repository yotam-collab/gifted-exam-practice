import { Link, useParams } from 'react-router';

/**
 * Printable worksheet generator — placeholder until build step 9 lands the
 * real print-CSS route (selectForSection + shapeRenderer + answer key).
 * Keeps library "create worksheet" links alive.
 */
export default function PrintRoute() {
  const { worksheetSpec } = useParams();
  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-10 page-enter text-center">
      <div className="text-6xl mb-4">🖨️</div>
      <h1 className="text-2xl font-extrabold text-glow mb-2">מחולל דפי העבודה בבנייה</h1>
      <p className="text-text-secondary text-sm mb-6">
        דף העבודה ("{worksheetSpec}") ייווצר כאן להדפסה ממש בקרוב.
      </p>
      <Link to="/library" className="btn-game inline-block px-6 py-3 no-underline">
        חזרה לספרייה
      </Link>
    </div>
  );
}
