import { useState, useCallback } from 'react';
import type { AppView, SessionMode, SessionConfig, SectionType, Difficulty, TimerMode } from './types';
import HomeScreen from './screens/HomeScreen';
import PracticeSetup from './screens/PracticeSetup';
import MiniExamSetup from './screens/MiniExamSetup';
import SessionScreen from './screens/SessionScreen';
import ResultsScreen from './screens/ResultsScreen';
import ParentDashboard from './screens/ParentDashboard';
import ParentLogin from './screens/ParentLogin';
import AchievementsScreen from './screens/AchievementsScreen';
import { SECTION_CONFIGS } from './config/sections';

const CHILD_USER_ID = 'child_itamar';

function App() {
  const [view, setView] = useState<AppView>('home');
  const [sessionConfig, setSessionConfig] = useState<{mode: SessionMode; config: SessionConfig} | null>(null);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);

  const startPractice = useCallback((sectionType: SectionType, difficulty: Difficulty, questionCount: number, timerMode: TimerMode) => {
    const section = SECTION_CONFIGS.find(s => s.type === sectionType)!;
    const config: SessionConfig = {
      sections: [sectionType],
      questionsPerSection: questionCount,
      difficulty,
      timerMode,
      timeLimitSec: timerMode === 'per_section' ? section.defaultTimeSec : undefined,
    };
    setSessionConfig({ mode: 'practice', config });
    setView('session_active');
  }, []);

  const startAdaptive = useCallback(() => {
    const config: SessionConfig = {
      sections: ['math', 'sentence_completion', 'word_relations', 'shapes', 'numbers_in_shapes'],
      questionsPerSection: 5,
      difficulty: 'adaptive',
      timerMode: 'per_question',
    };
    setSessionConfig({ mode: 'adaptive', config });
    setView('session_active');
  }, []);

  const startMiniExam = useCallback((sections: SectionType[], questionsPerSection: number, useTimer: boolean) => {
    const config: SessionConfig = {
      sections,
      questionsPerSection,
      difficulty: 'medium',
      timerMode: useTimer ? 'per_section' : 'none',
    };
    setSessionConfig({ mode: 'mini_exam', config });
    setView('session_active');
  }, []);

  const startFullExam = useCallback(() => {
    const allSections: SectionType[] = ['math', 'sentence_completion', 'word_relations', 'shapes', 'numbers_in_shapes'];
    const config: SessionConfig = {
      sections: allSections,
      questionsPerSection: 0, // 0 means use default from config
      difficulty: 'medium',
      timerMode: 'per_section',
    };
    setSessionConfig({ mode: 'full_exam', config });
    setView('session_active');
  }, []);

  const onSessionEnd = useCallback((sessionId: string) => {
    setLastSessionId(sessionId);
    setView('results');
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {view === 'home' && (
        <HomeScreen
          onNavigate={setView}
          onStartAdaptive={startAdaptive}
          onStartFullExam={startFullExam}
        />
      )}

      {view === 'practice_setup' && (
        <PracticeSetup
          onBack={() => setView('home')}
          onStart={startPractice}
        />
      )}

      {view === 'mini_exam_setup' && (
        <MiniExamSetup
          onBack={() => setView('home')}
          onStart={startMiniExam}
        />
      )}

      {view === 'session_active' && sessionConfig && (
        <SessionScreen
          userId={CHILD_USER_ID}
          mode={sessionConfig.mode}
          config={sessionConfig.config}
          onEnd={onSessionEnd}
          onQuit={() => setView('home')}
          isPracticeMode={sessionConfig.mode === 'practice' || sessionConfig.mode === 'adaptive'}
        />
      )}

      {view === 'results' && lastSessionId && (
        <ResultsScreen
          sessionId={lastSessionId}
          userId={CHILD_USER_ID}
          onHome={() => setView('home')}
          onPracticeAgain={() => setView('practice_setup')}
        />
      )}

      {view === 'parent_login' && (
        <ParentLogin
          onBack={() => setView('home')}
          onSuccess={() => setView('parent_dashboard')}
        />
      )}

      {view === 'parent_dashboard' && (
        <ParentDashboard
          childId={CHILD_USER_ID}
          onBack={() => setView('home')}
        />
      )}

      {view === 'achievements' && (
        <AchievementsScreen
          userId={CHILD_USER_ID}
          onBack={() => setView('home')}
        />
      )}
    </div>
  );
}

export default App;
