import { useNavigate } from 'react-router';
import PracticeSetup from '../screens/PracticeSetup';
import { buildPractice } from './sessionLaunch';

export default function PracticeRoute() {
  const navigate = useNavigate();
  return (
    <PracticeSetup
      onBack={() => navigate('/')}
      onStart={(section, difficulty, count, timer, skillTag) =>
        navigate('/session', { state: buildPractice(section, difficulty, count, timer, skillTag) })
      }
    />
  );
}
