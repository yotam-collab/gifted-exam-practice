import { useNavigate } from 'react-router';
import AchievementsScreen from '../screens/AchievementsScreen';
import { useCurrentUserId } from './currentUser';

export default function AchievementsRoute() {
  const navigate = useNavigate();
  const userId = useCurrentUserId();
  return <AchievementsScreen userId={userId} onBack={() => navigate('/')} />;
}
