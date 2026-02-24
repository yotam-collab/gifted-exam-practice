import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { SessionMode, SessionConfig, Session, SessionSection, SessionQuestion, Question, SectionType } from '../types';
import { questionBank } from '../data/questions';
import { SECTION_CONFIGS, getSectionConfig } from '../config/sections';
import { storage } from '../services/storage';
import { updateMastery, selectAdaptiveQuestions } from '../services/adaptive';
import { useTimer } from '../hooks/useTimer';
import { questionVisuals } from '../data/shapeVisuals';
import { ShapeAnalogy, ShapeSeries, ShapeGrid, ShapeRow, ShapeOddOneOut, ShapeBox, ShapeOptions } from '../utils/shapeRenderer';

interface Props {
  userId: string;
  mode: SessionMode;
  config: SessionConfig;
  onEnd: (sessionId: string) => void;
  onQuit: () => void;
  isPracticeMode: boolean;
}

export default function SessionScreen({ userId, mode, config, onEnd, onQuit, isPracticeMode }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [sectionTransition, setSectionTransition] = useState(false);
  const questionStartTime = useRef<number>(Date.now());
  const [questionsMap, setQuestionsMap] = useState<Map<string, Question>>(new Map());

  // Build session on mount
  useEffect(() => {
    const sessionId = `session_${Date.now()}`;
    const sections: SessionSection[] = [];
    const qMap = new Map<string, Question>();

    for (const sectionType of config.sections) {
      const sectionConfig = getSectionConfig(sectionType);
      const count = config.questionsPerSection || sectionConfig.defaultQuestionCount;

      let availableQuestions: Question[];
      if (mode === 'adaptive') {
        availableQuestions = selectAdaptiveQuestions(userId, count);
      } else {
        availableQuestions = questionBank.filter(q =>
          q.sectionType === sectionType && q.isActive
        );

        if (config.difficulty && config.difficulty !== 'adaptive') {
          const filtered = availableQuestions.filter(q => q.difficulty === config.difficulty);
          if (filtered.length >= count) {
            availableQuestions = filtered;
          }
        }

        // Shuffle and pick
        availableQuestions = shuffleArray(availableQuestions).slice(0, count);
      }

      const sessionQuestions: SessionQuestion[] = availableQuestions.map((q, i) => {
        qMap.set(q.id, q);
        return {
          id: `sq_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
          questionId: q.id,
          hintsUsed: 0,
        };
      });

      sections.push({
        sectionType,
        questions: sessionQuestions,
        timeLimitSec: config.timerMode === 'per_section'
          ? (config.timeLimitSec || sectionConfig.defaultTimeSec)
          : 0,
      });
    }

    const newSession: Session = {
      id: sessionId,
      userId,
      mode,
      startedAt: new Date().toISOString(),
      config,
      sections,
    };

    setSession(newSession);
    setQuestionsMap(qMap);
    questionStartTime.current = Date.now();
  }, []);

  const currentSection = session?.sections[currentSectionIdx];
  const currentSQ = currentSection?.questions[currentQuestionIdx];
  const currentQuestion = currentSQ ? questionsMap.get(currentSQ.questionId) : undefined;

  const sectionTimeSec = currentSection?.timeLimitSec || 0;

  const handleTimeUp = useCallback(() => {
    if (mode === 'full_exam' || mode === 'mini_exam') {
      // Auto-advance to next section
      handleNextSection();
    }
  }, [mode, currentSectionIdx]);

  const timer = useTimer(sectionTimeSec, handleTimeUp);

  // Start timer when section begins
  useEffect(() => {
    if (sectionTimeSec > 0 && session) {
      timer.reset(sectionTimeSec);
      timer.start();
    }
  }, [currentSectionIdx, session]);

  const handleAnswer = useCallback((optionIdx: number) => {
    if (selectedOption !== null || !currentQuestion || !currentSQ || !session) return;

    const timeSpent = (Date.now() - questionStartTime.current) / 1000;
    const isCorrect = optionIdx === currentQuestion.correctOption;

    setSelectedOption(optionIdx);

    // Update session question
    const updatedSession = { ...session };
    const section = updatedSession.sections[currentSectionIdx];
    const sq = section.questions[currentQuestionIdx];
    sq.selectedOption = optionIdx;
    sq.isCorrect = isCorrect;
    sq.timeSpentSec = Math.round(timeSpent);
    sq.answeredAt = new Date().toISOString();
    setSession(updatedSession);

    // Update mastery
    updateMastery(
      userId,
      currentQuestion.sectionType,
      currentQuestion.skillTag,
      isCorrect,
      timeSpent,
      currentQuestion.recommendedTimeSec
    );

    if (isPracticeMode) {
      setShowResult(true);
    } else {
      // In exam mode, auto-advance after short delay
      setTimeout(() => {
        advanceQuestion();
      }, 300);
    }
  }, [selectedOption, currentQuestion, currentSQ, session, currentSectionIdx, currentQuestionIdx, isPracticeMode, userId]);

  const advanceQuestion = useCallback(() => {
    if (!currentSection) return;

    setSelectedOption(null);
    setShowResult(false);
    setShowExplanation(false);

    if (currentQuestionIdx < currentSection.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      questionStartTime.current = Date.now();
    } else {
      handleNextSection();
    }
  }, [currentSection, currentQuestionIdx]);

  const handleNextSection = useCallback(() => {
    if (!session) return;

    timer.pause();

    if (currentSectionIdx < session.sections.length - 1) {
      setSectionTransition(true);
      setTimeout(() => {
        setCurrentSectionIdx(prev => prev + 1);
        setCurrentQuestionIdx(0);
        setSelectedOption(null);
        setShowResult(false);
        setShowExplanation(false);
        setSectionTransition(false);
        questionStartTime.current = Date.now();
      }, 2000);
    } else {
      endSession();
    }
  }, [session, currentSectionIdx]);

  const endSession = useCallback(() => {
    if (!session) return;

    const endedSession: Session = {
      ...session,
      endedAt: new Date().toISOString(),
    };

    // Calculate scores
    let totalCorrect = 0;
    let totalQuestions = 0;
    let totalTime = 0;

    for (const section of endedSession.sections) {
      for (const sq of section.questions) {
        totalQuestions++;
        if (sq.isCorrect) totalCorrect++;
        totalTime += sq.timeSpentSec || 0;
      }
    }

    endedSession.totalScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    endedSession.totalTimeSec = totalTime;

    storage.saveSession(endedSession);
    onEnd(endedSession.id);
  }, [session, onEnd]);

  if (!session || !currentSection || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-text-secondary">טוען...</div>
      </div>
    );
  }

  // Section transition screen
  if (sectionTransition) {
    const nextSection = session.sections[currentSectionIdx + 1];
    const nextConfig = nextSection ? getSectionConfig(nextSection.sectionType) : null;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">סיימת את הפרק!</h2>
        {nextConfig && (
          <p className="text-lg text-text-secondary">
            עוברים ל{nextConfig.nameHe} {nextConfig.icon}
          </p>
        )}
      </div>
    );
  }

  const sectionConfig = getSectionConfig(currentSection.sectionType);
  const progress = ((currentQuestionIdx + 1) / currentSection.questions.length) * 100;

  return (
    <div className="max-w-lg mx-auto px-4 py-4 min-h-screen flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            if (confirm('בטוח שאתה רוצה לצאת? ההתקדמות תישמר.')) {
              endSession();
            }
          }}
          className="text-text-secondary text-sm cursor-pointer hover:text-danger"
        >
          יציאה ✕
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: sectionConfig.color }}>
            {sectionConfig.icon} {sectionConfig.nameHe}
          </span>
          {session.sections.length > 1 && (
            <span className="text-xs text-text-secondary">
              (פרק {currentSectionIdx + 1} מתוך {session.sections.length})
            </span>
          )}
        </div>

        {/* Timer */}
        {sectionTimeSec > 0 && (
          <div className={`text-lg font-bold font-mono ${
            timer.isCritical ? 'timer-critical' : timer.isWarning ? 'timer-warning text-warning' : 'text-text'
          }`}>
            {timer.formatTime()}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-border rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full progress-fill"
          style={{ width: `${progress}%`, backgroundColor: sectionConfig.color }}
        ></div>
      </div>

      {/* Question Counter */}
      <div className="text-center text-sm text-text-secondary mb-4">
        שאלה {currentQuestionIdx + 1} מתוך {currentSection.questions.length}
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col">
        {(() => {
          const visual = questionVisuals[currentQuestion.id];
          const hasVisual = !!visual;
          const hasVisualOptions = !!visual?.optionShapes;

          return (
            <>
              {/* Question Stem */}
              <div className="bg-card rounded-2xl p-5 shadow-sm border border-border mb-4">
                {hasVisual && visual.stemLayout === 'analogy' && visual.stemShapes && (
                  <div className="flex justify-center mb-3">
                    <ShapeAnalogy shapes={visual.stemShapes} />
                  </div>
                )}
                {hasVisual && visual.stemLayout === 'series' && visual.stemShapes && (
                  <div className="flex justify-center mb-3">
                    <ShapeSeries shapes={visual.stemShapes} />
                  </div>
                )}
                {hasVisual && visual.stemLayout === 'grid' && visual.gridCells && (
                  <div className="flex justify-center mb-3">
                    <ShapeGrid cells={visual.gridCells} />
                  </div>
                )}
                {hasVisual && visual.stemLayout === 'row' && visual.stemShapes && (
                  <div className="flex justify-center mb-3">
                    <ShapeRow shapes={visual.stemShapes} />
                  </div>
                )}
                {hasVisual && visual.stemLayout === 'odd_one_out' && visual.stemShapes && (
                  <div className="flex justify-center mb-3">
                    <ShapeOddOneOut shapes={visual.stemShapes} />
                  </div>
                )}
                <p className={`text-lg font-medium leading-relaxed ${hasVisual ? 'text-center text-sm text-text-secondary' : ''}`}>
                  {currentQuestion.stem}
                </p>
              </div>

              {/* Visual Shape Options (when available) */}
              {hasVisualOptions && visual.optionShapes ? (
                <div className="mb-4">
                  <ShapeOptions
                    options={visual.optionShapes}
                    selected={selectedOption ?? undefined}
                    onSelect={(idx) => handleAnswer(idx)}
                    disabled={selectedOption !== null}
                  />
                  {/* Show correct/wrong indicators after answer */}
                  {showResult && (
                    <div className="flex justify-center gap-4 mt-3">
                      {visual.optionShapes.map((_, idx) => {
                        if (idx === currentQuestion.correctOption) {
                          return <span key={idx} className="text-success text-sm font-bold">{String.fromCharCode(1488 + idx)} - נכון ✓</span>;
                        }
                        if (idx === selectedOption && idx !== currentQuestion.correctOption) {
                          return <span key={idx} className="text-danger text-sm font-bold">{String.fromCharCode(1488 + idx)} - שגוי ✗</span>;
                        }
                        return null;
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Text Options (default) */
                <div className="space-y-3 mb-4">
                  {currentQuestion.options.map((option, idx) => {
                    let btnClass = 'option-btn w-full p-4 rounded-xl border-2 text-right cursor-pointer bg-card';

                    if (showResult) {
                      if (idx === currentQuestion.correctOption) {
                        btnClass += ' correct';
                      } else if (idx === selectedOption && idx !== currentQuestion.correctOption) {
                        btnClass += ' wrong';
                      } else {
                        btnClass += ' border-border opacity-60';
                      }
                    } else if (selectedOption === idx) {
                      btnClass += ' selected';
                    } else {
                      btnClass += ' border-border hover:border-primary-light';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        disabled={selectedOption !== null}
                        className={btnClass}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 text-sm font-bold ${
                            showResult && idx === currentQuestion.correctOption
                              ? 'bg-success text-white border-success'
                              : showResult && idx === selectedOption && idx !== currentQuestion.correctOption
                              ? 'bg-danger text-white border-danger'
                              : selectedOption === idx
                              ? 'bg-primary text-white border-primary'
                              : 'border-gray-300 text-text-secondary'
                          }`}>
                            {String.fromCharCode(1488 + idx)}
                          </div>
                          <span className="text-base">{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}

        {/* Practice Mode: Result & Explanation */}
        {isPracticeMode && showResult && (
          <div className="mb-4">
            <div className={`p-4 rounded-xl mb-3 ${
              currentSQ.isCorrect ? 'bg-green-50 border border-success' : 'bg-red-50 border border-danger'
            }`}>
              <div className="font-bold text-lg mb-1">
                {currentSQ.isCorrect ? 'כל הכבוד! 🌟' : 'לא נורא, נלמד מזה! 💪'}
              </div>
              {!showExplanation && (
                <button
                  onClick={() => setShowExplanation(true)}
                  className="text-primary text-sm underline cursor-pointer"
                >
                  הראה הסבר
                </button>
              )}
              {showExplanation && (
                <p className="text-sm text-text-secondary mt-2">{currentQuestion.explanation}</p>
              )}
            </div>

            <button
              onClick={advanceQuestion}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl cursor-pointer hover:bg-primary-dark transition-colors"
            >
              {currentQuestionIdx < currentSection.questions.length - 1 ? 'שאלה הבאה ←' : 'סיום 🏁'}
            </button>
          </div>
        )}

        {/* Exam mode: Next button (shown after selection) */}
        {!isPracticeMode && selectedOption !== null && !showResult && (
          <button
            onClick={advanceQuestion}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl cursor-pointer hover:bg-primary-dark transition-colors mb-4"
          >
            {currentQuestionIdx < currentSection.questions.length - 1 ? 'הבאה ←' : 'סיום פרק'}
          </button>
        )}
      </div>
    </div>
  );
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
