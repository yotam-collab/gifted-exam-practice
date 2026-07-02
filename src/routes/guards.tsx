import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { useEntitlement } from '../hooks/useEntitlement';

function Spinner() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="text-text-secondary animate-float">טוען...</div>
    </div>
  );
}

/** Requires a logged-in parent (or local-only mode). Sends anon users to /auth. */
export function RequireAuth() {
  const { user, loading, localOnly } = useAuth();
  const location = useLocation();
  if (localOnly) return <Outlet />;
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Requires an active kit entitlement. Sends non-buyers to /paywall. */
export function RequireEntitlement() {
  const { status, isEntitled } = useEntitlement();
  if (status === 'loading') return <Spinner />;
  if (!isEntitled) return <Navigate to="/paywall" replace />;
  return <Outlet />;
}
