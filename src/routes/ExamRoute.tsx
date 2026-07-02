import { useNavigate } from 'react-router';
import MiniExamSetup from '../screens/MiniExamSetup';
import { buildMiniExam } from './sessionLaunch';

export default function ExamRoute() {
  const navigate = useNavigate();
  return (
    <MiniExamSetup
      onBack={() => navigate('/')}
      onStart={(sections, questionsPerSection, useTimer) =>
        navigate('/session', { state: buildMiniExam(sections, questionsPerSection, useTimer) })
      }
    />
  );
}
