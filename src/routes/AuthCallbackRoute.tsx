import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

/**
 * Magic-link landing. supabase-js (detectSessionInUrl) processes the hash
 * automatically; we just wait for the session to settle, then send the parent
 * to their dashboard. Full-bleed route — no shell.
 */
export default function AuthCallbackRoute() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [tooLong, setTooLong] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      navigate('/parent', { replace: true });
    }
  }, [loading, session, navigate]);

  useEffect(() => {
    // If nothing resolves in a few seconds, offer a way out.
    const t = setTimeout(() => setTooLong(true), 5000);
    // Nudge supabase to re-read the URL in case the provider is slow.
    if (supabase) supabase.auth.getSession();
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="text-5xl mb-4 animate-float">🔓</div>
      <div className="text-lg font-bold text-glow mb-2">מכניסים אתכם פנימה...</div>
      {tooLong && (
        <button
          onClick={() => navigate('/auth', { replace: true })}
          className="text-sm text-primary-light underline mt-3 cursor-pointer"
        >
          נתקע? חזרה למסך הכניסה
        </button>
      )}
    </div>
  );
}
