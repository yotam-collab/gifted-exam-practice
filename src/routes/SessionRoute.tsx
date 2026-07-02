import { Navigate, useLocation, useNavigate } from 'react-router';
import SessionScreen from '../screens/SessionScreen';
import { isSessionLaunch } from './sessionLaunch';
import { useCurrentUserId } from './currentUser';

/**
 * SessionConfig is too rich for the URL, so launches arrive via
 * `navigate('/session', { state })`. Direct hits / refreshes without state
 * bounce back home — a session can't resume mid-flight anyway (question
 * pools are generated per launch).
 */
export default function SessionRoute() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const userId = useCurrentUserId();

  if (!isSessionLaunch(state)) return <Navigate to="/" replace />;

  return (
    <SessionScreen
      userId={userId}
      mode={state.mode}
      config={state.config}
      onEnd={(sessionId) => navigate(`/results/${sessionId}`, { replace: true })}
      onQuit={() => navigate('/')}
      isPracticeMode={state.mode === 'practice' || state.mode === 'adaptive'}
    />
  );
}
