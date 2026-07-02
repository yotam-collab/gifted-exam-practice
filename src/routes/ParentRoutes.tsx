import { useNavigate } from 'react-router';
import ParentDashboard from '../screens/ParentDashboard';
import ParentLogin from '../screens/ParentLogin';
import { useCurrentUserId } from './currentUser';

/**
 * Temporary PIN gate — replaced by real Supabase auth (RequireAuth) at build
 * step 5. Kept as-is so the router migration lands with identical behavior.
 */
export function ParentLoginRoute() {
  const navigate = useNavigate();
  return (
    <ParentLogin
      onBack={() => navigate('/')}
      onSuccess={() => navigate('/parent')}
    />
  );
}

export function ParentDashboardRoute() {
  const navigate = useNavigate();
  const childId = useCurrentUserId();
  return <ParentDashboard childId={childId} onBack={() => navigate('/')} />;
}
