import { useState, useCallback } from 'react';
import type {
  Session,
  SessionMode,
  SessionConfig,
  SessionQuestion,
  SessionSection,
  SectionType,
  Question,
} from '../types';
import { storage } from '../services/storage';
import { updateMastery, selectAdaptiveQuestions } from '../services/adaptive';
import { generateFresh, getQuestionById } from '../services/questionPool';
import { SECTION_CONFIGS } from '../config/sections';

export interface UseSessionReturn {
  session: Session | null;
  currentSection: number;
  currentQuestion: number;
  startSession: (mode: SessionMode, config: SessionConfig) => void;
  answerQuestion: (selectedOption: number) => { isCorrect: boolean; explanation: string };
  nextQuestion: () => boolean;  // returns false if section/exam ended
  nextSection: () => boolean;   // returns false if exam ended
  endSession: () => Session;
  getProgress: () => {
    section: number;
    question: number;
    totalQuestions: number;
    totalSections: number;
  };
}

export function useSession(userId: string): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // ── Start a new session ──────────────────────────────────────────

  const startSession = useCallback(
    (mode: SessionMode, config: SessionConfig) => {
      const sections: SessionSection[] = [];

      if (mode === 'adaptive') {
        // Adaptive mode: select questions across all configured sections
        const adaptiveQuestions = selectAdaptiveQuestions(userId, config.questionsPerSection * config.sections.length);

        // Group adaptive questions by section
        const grouped = new Map<SectionType, Question[]>();
        for (const q of adaptiveQuestions) {
          const existing = grouped.get(q.sectionType) ?? [];
          existing.push(q);
          grouped.set(q.sectionType, existing);
        }

        for (const sectionType of config.sections) {
          const questionsForSection = grouped.get(sectionType) ?? [];
          const sectionConfig = SECTION_CONFIGS.find((s) => s.type === sectionType);
          const timeLimitSec = config.timeLimitSec ?? sectionConfig?.defaultTimeSec ?? 600;

          sections.push({
            sectionType,
            timeLimitSec,
            questions: questionsForSection.map((q) => createSessionQuestion(q.id)),
          });
        }
      } else {
        // Practice / mini_exam / full_exam: generate fresh questions
        for (const sectionType of config.sections) {
          const sectionConfig = SECTION_CONFIGS.find((s) => s.type === sectionType);
          const timeLimitSec = config.timeLimitSec ?? sectionConfig?.defaultTimeSec ?? 600;

          // Generate fresh questions — no repeats!
          const picked = generateFresh(
            sectionType,
            config.difficulty || 'medium',
            config.questionsPerSection,
          );

          sections.push({
            sectionType,
            timeLimitSec,
            questions: picked.map((q) => createSessionQuestion(q.id)),
          });
        }
      }

      const newSession: Session = {
        id: `session_${Date.now()}`,
        userId,
        mode,
        startedAt: new Date().toISOString(),
        config,
        sections,
      };

      // Mark first question as shown
      if (sections.length > 0 && sections[0].questions.length > 0) {
        sections[0].startedAt = new Date().toISOString();
        sections[0].questions[0].shownAt = new Date().toISOString();
      }

      setSession(newSession);
      setCurrentSection(0);
      setCurrentQuestion(0);
    },
    [userId]
  );

  // ── Answer the current question ──────────────────────────────────

  const answerQuestion = useCallback(
    (selectedOption: number): { isCorrect: boolean; explanation: string } => {
      if (!session) {
        return { isCorrect: false, explanation: '' };
      }

      const section = session.sections[currentSection];
      if (!section) return { isCorrect: false, explanation: '' };

      const sq = section.questions[currentQuestion];
      if (!sq) return { isCorrect: false, explanation: '' };

      // Find the original question from the pool
      const question = getQuestionById(sq.questionId);
      if (!question) return { isCorrect: false, explanation: '' };

      const isCorrect = selectedOption === question.correctOption;
      const now = new Date().toISOString();

      // Calculate time spent
      const shownTime = sq.shownAt ? new Date(sq.shownAt).getTime() : Date.now();
      const timeSpentSec = Math.round((Date.now() - shownTime) / 1000);

      // Update the session question
      sq.answeredAt = now;
      sq.selectedOption = selectedOption;
      sq.isCorrect = isCorrect;
      sq.timeSpentSec = timeSpentSec;

      // Update mastery
      updateMastery(
        userId,
        question.sectionType,
        question.skillTag,
        isCorrect,
        timeSpentSec,
        question.recommendedTimeSec
      );

      // Trigger re-render with updated session
      setSession({ ...session });

      return { isCorrect, explanation: question.explanation };
    },
    [session, currentSection, currentQuestion, userId]
  );

  // ── Navigate to next question ────────────────────────────────────

  const nextQuestion = useCallback((): boolean => {
    if (!session) return false;

    const section = session.sections[currentSection];
    if (!section) return false;

    const nextIdx = currentQuestion + 1;
    if (nextIdx >= section.questions.length) {
      // Section ended
      return false;
    }

    // Mark the next question as shown
    section.questions[nextIdx].shownAt = new Date().toISOString();
    setCurrentQuestion(nextIdx);
    setSession({ ...session });
    return true;
  }, [session, currentSection, currentQuestion]);

  // ── Navigate to next section ─────────────────────────────────────

  const nextSection = useCallback((): boolean => {
    if (!session) return false;

    // Mark current section as ended
    const current = session.sections[currentSection];
    if (current) {
      current.endedAt = new Date().toISOString();
    }

    const nextIdx = currentSection + 1;
    if (nextIdx >= session.sections.length) {
      // Exam ended
      return false;
    }

    // Start the next section
    const nextSec = session.sections[nextIdx];
    nextSec.startedAt = new Date().toISOString();
    if (nextSec.questions.length > 0) {
      nextSec.questions[0].shownAt = new Date().toISOString();
    }

    setCurrentSection(nextIdx);
    setCurrentQuestion(0);
    setSession({ ...session });
    return true;
  }, [session, currentSection]);

  // ── End the session ──────────────────────────────────────────────

  const endSession = useCallback((): Session => {
    if (!session) {
      throw new Error('No active session to end');
    }

    const now = new Date().toISOString();

    // Mark current section as ended if not already
    const currentSec = session.sections[currentSection];
    if (currentSec && !currentSec.endedAt) {
      currentSec.endedAt = now;
    }

    // Calculate total score
    let totalCorrect = 0;
    let totalAnswered = 0;
    let totalTimeSec = 0;

    for (const section of session.sections) {
      for (const q of section.questions) {
        if (q.answeredAt !== undefined) {
          totalAnswered++;
          if (q.isCorrect) totalCorrect++;
          totalTimeSec += q.timeSpentSec ?? 0;
        }
      }
    }

    const finishedSession: Session = {
      ...session,
      endedAt: now,
      totalScore: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
      totalTimeSec,
    };

    // Persist the session
    storage.saveSession(finishedSession);

    setSession(finishedSession);
    return finishedSession;
  }, [session, currentSection]);

  // ── Get progress info ────────────────────────────────────────────

  const getProgress = useCallback(() => {
    if (!session) {
      return { section: 0, question: 0, totalQuestions: 0, totalSections: 0 };
    }

    const totalQuestions = session.sections[currentSection]?.questions.length ?? 0;
    return {
      section: currentSection + 1,
      question: currentQuestion + 1,
      totalQuestions,
      totalSections: session.sections.length,
    };
  }, [session, currentSection, currentQuestion]);

  return {
    session,
    currentSection,
    currentQuestion,
    startSession,
    answerQuestion,
    nextQuestion,
    nextSection,
    endSession,
    getProgress,
  };
}

// ── Helpers ────────────────────────────────────────────────────────

function createSessionQuestion(questionId: string): SessionQuestion {
  return {
    id: `sq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    questionId,
    hintsUsed: 0,
  };
}

