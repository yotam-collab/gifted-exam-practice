import { Link, useSearchParams } from 'react-router';
import { useAuth } from '../hooks/useAuth';

// Where the parent completes the purchase — the existing marketing site,
// where Grow checkout already lives. Fill via env when the page URL is known.
const CHECKOUT_URL = (import.meta.env.VITE_CHECKOUT_URL as string | undefined) ?? '#';

const VALUE_POINTS = [
  { icon: '♾️', title: 'אינסוף שאלות, אפס שינון', text: 'המערכת מייצרת שאלות חדשות בכל פעם — אי אפשר "לגמור" את החומר או לשנן תשובות.' },
  { icon: '🎯', title: 'תוכנית אישית חכמה', text: 'זיהוי אוטומטי של 44 המיומנויות החלשות, ותרגול שמכוון בדיוק לשם.' },
  { icon: '🖨️', title: 'אינסוף דפי עבודה מודפסים', text: 'תרגול על הנייר, בלי מסך — דף חדש בכל לחיצה, עם דף תשובות להורים.' },
  { icon: '⏱️', title: 'סימולציות אמת', text: 'מבחני דמה מלאים עם טיימרים לכל פרק והיסטוריית ציונים.' },
  { icon: '📊', title: 'שקיפות מלאה להורה', text: 'לוח בקרה אמיתי: מגמות, נקודות חוזק וחולשה, והמלצות שבועיות.' },
];

export default function PaywallRoute() {
  const [params] = useSearchParams();
  const itemTitle = params.get('item');
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-10 page-enter">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🔓</div>
        <h1 className="text-3xl font-extrabold text-glow mb-2">פותחים את הערכה המלאה</h1>
        {itemTitle && (
          <p className="text-text-secondary text-sm">
            "{itemTitle}" הוא חלק מהערכה המלאה של זינוק מחוננים.
          </p>
        )}
      </div>

      <div className="game-card p-6 mb-6">
        <div className="flex flex-col gap-4">
          {VALUE_POINTS.map((p) => (
            <div key={p.title} className="flex items-start gap-3">
              <div className="text-2xl shrink-0">{p.icon}</div>
              <div>
                <div className="font-bold text-text">{p.title}</div>
                <div className="text-sm text-text-secondary leading-snug">{p.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="game-card p-6 text-center">
        <div className="text-sm text-text-secondary mb-1">גישה מלאה עד תום עונת המבחנים</div>
        <div className="mb-4">
          <span className="text-4xl font-extrabold text-glow">₪249</span>
          <span className="text-text-secondary text-sm"> / חד-פעמי</span>
        </div>
        <a href={CHECKOUT_URL} className="btn-game inline-block px-8 py-4 text-lg no-underline w-full sm:w-auto">
          לרכישת הערכה המלאה
        </a>
        <div className="text-xs text-text-secondary mt-4">
          {user ? (
            <>כבר רכשתם? הגישה נפתחת אוטומטית תוך דקות מהתשלום.</>
          ) : (
            <>
              כבר רכשתם?{' '}
              <Link to="/auth" className="text-primary-light underline">היכנסו עם המייל</Link>{' '}
              שאיתו רכשתם.
            </>
          )}
        </div>
      </div>

      <div className="text-center mt-6">
        <Link to="/library" className="text-sm text-text-secondary hover:text-primary-light no-underline">
          המשך לעיין בספרייה
        </Link>
      </div>
    </div>
  );
}
