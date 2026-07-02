import { Navigate, useNavigate, useParams } from 'react-router';
import ResultsScreen from '../screens/ResultsScreen';
import { useCurrentUserId } from './currentUser';

export default function ResultsRoute() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const userId = useCurrentUserId();

  if (!sessionId) return <Navigate to="/" replace />;

  return (
    <ResultsScreen
      sessionId={sessionId}
      userId={userId}
      onHome={() => navigate('/')}
      onPracticeAgain={() => navigate('/practice')}
    />
  );
}
