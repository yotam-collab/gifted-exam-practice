import { useState } from 'react';
import { Link } from 'react-router';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Parent sign-in — email magic link (OTP). No passwords. After a purchase on
 * the marketing site, the Grow webhook has already invited the buyer's email;
 * here they simply request the link to log in.
 */
export default function AuthRoute() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (!isSupabaseConfigured || !supabase) {
      setState('error');
      setError('המערכת עדיין לא מחוברת. נסו שוב מאוחר יותר.');
      return;
    }
    setState('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}auth/callback` },
    });
    if (error) {
      setState('error');
      setError(error.message);
    } else {
      setState('sent');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 page-enter">
      <div className="game-card p-7 text-center">
        <div className="text-5xl mb-3">🔑</div>
        <h1 className="text-2xl font-extrabold text-glow mb-1">כניסת הורים</h1>
        <p className="text-text-secondary text-sm mb-6">
          נשלח לכם קישור כניסה למייל — בלי סיסמאות.
        </p>

        {state === 'sent' ? (
          <div className="result-correct rounded-2xl p-5">
            <div className="text-3xl mb-2">📬</div>
            <div className="font-bold mb-1">הקישור בדרך אליכם!</div>
            <p className="text-sm text-text-secondary">
              בדקו את תיבת המייל <b className="text-text">{email}</b> ולחצו על הקישור כדי להיכנס.
              אם לא הגיע תוך דקה — בדקו בתיקיית הספאם.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <input
              type="email"
              inputMode="email"
              dir="ltr"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-text text-center focus:border-primary outline-none"
              required
            />
            <button
              type="submit"
              disabled={state === 'sending'}
              className="btn-game py-3 disabled:opacity-50"
            >
              {state === 'sending' ? 'שולח...' : 'שלחו לי קישור כניסה'}
            </button>
            {state === 'error' && <p className="text-danger text-xs">{error}</p>}
          </form>
        )}

        <Link to="/" className="block text-xs text-text-secondary mt-5 hover:text-primary-light no-underline">
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  );
}
