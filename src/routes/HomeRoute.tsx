import { useNavigate } from 'react-router';
import HomeScreen from '../screens/HomeScreen';
import { buildAdaptive, buildFullExam } from './sessionLaunch';
import type { AppView } from '../types';

/** Maps the legacy AppView names HomeScreen emits to router paths. */
const VIEW_TO_PATH: Partial<Record<AppView, string>> = {
  home: '/',
  practice_setup: '/practice',
  mini_exam_setup: '/exam',
  achievements: '/achievements',
  parent_login: '/parent-login',
  parent_dashboard: '/parent',
};

export default function HomeRoute() {
  const navigate = useNavigate();
  return (
    <HomeScreen
      onNavigate={(view) => navigate(VIEW_TO_PATH[view] ?? '/')}
      onStartAdaptive={() => navigate('/session', { state: buildAdaptive() })}
      onStartFullExam={() => navigate('/session', { state: buildFullExam() })}
    />
  );
}
