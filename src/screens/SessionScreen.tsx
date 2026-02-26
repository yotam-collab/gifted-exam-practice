import { useState, useEffect, useCallback, useRef } from 'react';
import type { SessionMode, SessionConfig, Session, SessionSection, SessionQuestion, Question } from '../types';
import { questionBank } from '../data/questions';
import { getSectionConfig } from '../config/sections';
import { storage } from '../services/storage';
import { updateMastery, selectAdaptiveQuestions } from '../services/adaptive';
import { useTimer } from '../hooks/useTimer';
import { questionVisuals } from '../data/shapeVisuals';
import { numberShapeVisuals } from '../data/numberShapeVisuals';
import { ShapeAnalogy, ShapeSeries, ShapeGrid, ShapeRow, ShapeOddOneOut, ShapeOptions, DividedCirclePair, NumberPyramid, NumberGrid, NumberFlowChart, NumberTriangle } from '../utils/shapeRenderer';
import { sounds } from '../services/sounds';

interface Props {
  userId: string;
  mode: SessionMode;
  config: SessionConfig;
  onEnd: (sessionId: string) => void;
  onQuit: () => void;
  isPracticeMode: boolean;
}

// ===== Varied feedback messages =====
const correctMessages = [
  'כל הכבוד! 🍉',
  'מעולה! 🔥',
  'מדהים! ⚔️',
  'נכון! 🎯',
  'יופי! 🍎',
  'בול פגיעה! 🎪',
  'חזק! 💪',
  'אלוף! 🏆',
  'בדיוק! ✨',
  'מושלם! 🌟',
];

const wrongMessages = [
  'לא נורא, נלמד מזה! 💨',
  'בפעם הבאה! 🍀',
  'לא מוותרים! 💪',
  'ממשיכים קדימה! 🚀',
  'טעויות מלמדות! 🌱',
  'קדימה לשאלה הבאה! 🔄',
  'נתרגל עוד! 📚',
  'זה בסדר! 🌈',
];

const timeoutMessages = [
  'נגמר הזמן! ⏱️',
  'הזמן אזל! ⏰',
  'לא הספקת הפעם! ⏱️',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function SessionScreen({ userId, mode, config, onEnd, isPracticeMode }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [sectionTransition, setSectionTransition] = useState(false);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [timedOut, setTimedOut] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const questionStartTime = useRef<number>(Date.now());
  const [questionsMap, setQuestionsMap] = useState<Map<string, Question>>(new Map());

  // Refs for timer callback (avoid stale closures)
  const showResultRef = useRef(false);
  const selectedOptionRef = useRef<number | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const currentSectionIdxRef = useRef(0);
  const currentQuestionIdxRef = useRef(0);

  // Keep refs in sync
  showResultRef.current = showResult;
  selectedOptionRef.current = selectedOption;
  sessionRef.current = session;
  currentSectionIdxRef.current = currentSectionIdx;
  currentQuestionIdxRef.current = currentQuestionIdx;

  const isPerQuestionTimer = config.timerMode === 'per_question';
  const isPerSectionTimer = config.timerMode === 'per_section';

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
        timeLimitSec: isPerSectionTimer
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
    setInitialized(true);
  }, []);

  const currentSection = session?.sections[currentSectionIdx];
  const currentSQ = currentSection?.questions[currentQuestionIdx];
  const currentQuestion = currentSQ ? questionsMap.get(currentSQ.questionId) : undefined;

  // Visual lookups (moved to component scope for use in explanations)
  const visual = currentQuestion ? questionVisuals[currentQuestion.id] : undefined;
  const nsVisual = currentQuestion ? numberShapeVisuals[currentQuestion.id] : undefined;

  const sectionTimeSec = currentSection?.timeLimitSec || 0;

  // Timer time-up handler
  const handleTimeUp = useCallback(() => {
    if (isPerQuestionTimer) {
      // Don't interrupt if already showing result or already answered
      if (showResultRef.current || selectedOptionRef.current !== null) return;

      // Record time spent on timed-out question
      const s = sessionRef.current;
      if (s) {
        const updatedSession = { ...s };
        const section = updatedSession.sections[currentSectionIdxRef.current];
        const sq = section.questions[currentQuestionIdxRef.current];
        sq.timeSpentSec = Math.round((Date.now() - questionStartTime.current) / 1000);
        setSession(updatedSession);
      }

      if (isPracticeMode) {
        sounds.playTimeUp();
        setTimedOut(true);
        setShowResult(true);
        setShowExplanation(true);
        setFeedbackMsg(pickRandom(timeoutMessages));
      } else {
        // Exam mode: silently advance
        advanceQuestion();
      }
    } else if (isPerSectionTimer) {
      // Per-section timeout
      if (mode === 'full_exam' || mode === 'mini_exam') {
        sounds.playTimeUp();
        handleNextSection();
      }
    }
  }, [isPerQuestionTimer, isPerSectionTimer, isPracticeMode, mode]);

  const timer = useTimer(0, handleTimeUp);

  // Per-SECTION timer: reset only when section changes (NOT on session update)
  useEffect(() => {
    if (initialized && isPerSectionTimer && sectionTimeSec > 0) {
      timer.reset(sectionTimeSec);
      timer.start();
    }
  }, [currentSectionIdx, initialized, isPerSectionTimer, sectionTimeSec]);

  // Per-QUESTION timer: reset on each new question
  useEffect(() => {
    if (initialized && isPerQuestionTimer && currentQuestion) {
      const questionTime = currentQuestion.recommendedTimeSec || 60;
      timer.reset(questionTime);
      timer.start();
    }
  }, [currentQuestionIdx, currentSectionIdx, initialized, isPerQuestionTimer, currentQuestion?.id]);

  const handleAnswer = useCallback((optionIdx: number) => {
    if (selectedOption !== null || !currentQuestion || !currentSQ || !session) return;

    const timeSpent = (Date.now() - questionStartTime.current) / 1000;
    const isCorrect = optionIdx === currentQuestion.correctOption;

    setSelectedOption(optionIdx);
    setTimedOut(false);

    // Pause timer when answer is given
    if (isPerQuestionTimer) {
      timer.pause();
    }

    // Combo and sounds - only in practice modes
    if (isPracticeMode) {
      if (isCorrect) {
        const newCombo = combo + 1;
        setCombo(newCombo);
        if (newCombo >= 3) {
          setShowCombo(true);
          setTimeout(() => setShowCombo(false), 1500);
          sounds.playCombo();
        } else {
          sounds.playCorrect();
        }
        setFeedbackMsg(pickRandom(correctMessages));
      } else {
        setCombo(0);
        sounds.playWrong();
        setFeedbackMsg(pickRandom(wrongMessages));
      }
    }

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
      // Auto-expand explanation when wrong (item 3)
      if (!isCorrect) {
        setShowExplanation(true);
      }
    } else {
      // In exam mode, auto-advance after short delay
      setTimeout(() => {
        advanceQuestion();
      }, 300);
    }
  }, [selectedOption, currentQuestion, currentSQ, session, currentSectionIdx, currentQuestionIdx, isPracticeMode, userId, combo, isPerQuestionTimer, timer]);

  const advanceQuestion = useCallback(() => {
    if (!currentSection) return;

    setSelectedOption(null);
    setShowResult(false);
    setShowExplanation(false);
    setTimedOut(false);

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
        setTimedOut(false);
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
        <div className="text-xl text-text-secondary animate-float">טוען...</div>
      </div>
    );
  }

  // Section transition screen
  if (sectionTransition) {
    const nextSection = session.sections[currentSectionIdx + 1];
    const nextConfig = nextSection ? getSectionConfig(nextSection.sectionType) : null;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 ninja-enter">
        <div className="bg-shapes">
          <div className="bg-shape" style={{ width: 200, height: 200, top: '20%', right: '10%', background: '#E85D3A' }} />
          <div className="bg-shape" style={{ width: 150, height: 150, bottom: '20%', left: '10%', background: '#27AE60' }} />
        </div>
        <div className="animate-bounce-in relative z-10">
          <div className="text-7xl mb-4">⚔️</div>
          <h2 className="text-2xl font-bold mb-2 text-glow">סיימת את הפרק!</h2>
          {nextConfig && (
            <p className="text-lg text-text-secondary">
              עוברים ל{nextConfig.nameHe} {nextConfig.icon}
            </p>
          )}
        </div>
      </div>
    );
  }

  const sectionConfig = getSectionConfig(currentSection.sectionType);
  const progress = ((currentQuestionIdx + 1) / currentSection.questions.length) * 100;
  const correctSoFar = currentSection.questions.filter(q => q.isCorrect).length;
  const hasVisual = !!visual;
  const hasNSVisual = !!nsVisual;
  const hasVisualOptions = !!visual?.optionShapes;
  const showTimer = config.timerMode !== 'none' && initialized;

  // Helper: render visual diagram (reusable for stem and explanation)
  const renderVisual = (small?: boolean) => {
    const wrapClass = small ? 'flex justify-center mb-2 scale-75 origin-center' : 'flex justify-center mb-3';
    return (
      <>
        {hasVisual && visual.stemLayout === 'analogy' && visual.stemShapes && (
          <div className={wrapClass}><ShapeAnalogy shapes={visual.stemShapes} /></div>
        )}
        {hasVisual && visual.stemLayout === 'series' && visual.stemShapes && (
          <div className={wrapClass}><ShapeSeries shapes={visual.stemShapes} /></div>
        )}
        {hasVisual && visual.stemLayout === 'grid' && visual.gridCells && (
          <div className={wrapClass}><ShapeGrid cells={visual.gridCells} /></div>
        )}
        {hasVisual && visual.stemLayout === 'row' && visual.stemShapes && (
          <div className={wrapClass}><ShapeRow shapes={visual.stemShapes} /></div>
        )}
        {hasVisual && visual.stemLayout === 'odd_one_out' && visual.stemShapes && (
          <div className={wrapClass}><ShapeOddOneOut shapes={visual.stemShapes} /></div>
        )}
        {hasNSVisual && (
          <div className={wrapClass}>
            {nsVisual.type === 'divided_circle_pair' && (
              <DividedCirclePair circle1={nsVisual.circle1} circle2={nsVisual.circle2} missingCircle={nsVisual.missingCircle} missingIndex={nsVisual.missingIndex} />
            )}
            {nsVisual.type === 'number_pyramid' && (
              <NumberPyramid rows={nsVisual.rows} missingRow={nsVisual.missingRow} missingCol={nsVisual.missingCol} />
            )}
            {nsVisual.type === 'number_grid' && (
              <NumberGrid rows={nsVisual.rows} missingRow={nsVisual.missingRow} missingCol={nsVisual.missingCol} />
            )}
            {nsVisual.type === 'number_flow' && (
              <NumberFlowChart nodes={nsVisual.nodes} operations={nsVisual.operations} missingIndex={nsVisual.missingIndex} />
            )}
            {nsVisual.type === 'number_triangle' && (
              <NumberTriangle top={nsVisual.top} bottomLeft={nsVisual.bottomLeft} bottomRight={nsVisual.bottomRight} center={nsVisual.center} missingPosition={nsVisual.missingPosition} />
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 min-h-screen flex flex-col relative page-enter">
      {/* Combo popup - only in practice modes */}
      {isPracticeMode && showCombo && combo >= 3 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-2xl font-extrabold text-lg shadow-lg">
            {combo >= 5 ? '🔥🔥🔥' : combo >= 3 ? '🔥🔥' : '🔥'} רצף של {combo}!
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            if (confirm('בטוח שאתה רוצה לצאת? ההתקדמות תישמר.')) {
              endSession();
            }
          }}
          className="text-text-secondary text-sm cursor-pointer hover:text-danger transition-colors"
        >
          יציאה ✕
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold px-3 py-1 rounded-full" style={{
            backgroundColor: sectionConfig.color + '20',
            color: sectionConfig.color,
          }}>
            {sectionConfig.icon} {sectionConfig.nameHe}
          </span>
          {session.sections.length > 1 && (
            <span className="text-xs text-text-secondary">
              ({currentSectionIdx + 1}/{session.sections.length})
            </span>
          )}
        </div>

        {/* Section Timer (per-section mode) */}
        {isPerSectionTimer && showTimer && (
          <div className={`text-lg font-bold font-mono ${
            timer.isCritical ? 'timer-critical' : timer.isWarning ? 'timer-warning text-warning' : 'text-text'
          }`}>
            {timer.formatTime()}
          </div>
        )}

        {/* Correct counter - only in practice modes */}
        {isPracticeMode && !isPerSectionTimer && (
          <span className="text-success font-bold text-sm">{correctSoFar} ✓</span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="progress-track h-2 mb-2">
        <div
          className="h-full rounded-full progress-fill"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Question Counter + Per-question timer + Score */}
      <div className="flex justify-between items-center text-sm text-text-secondary mb-4">
        <span>שאלה {currentQuestionIdx + 1} מתוך {currentSection.questions.length}</span>

        {/* Per-question timer display */}
        {isPerQuestionTimer && showTimer && (
          <div className={`question-timer ${
            timer.isCritical ? 'critical' : timer.isWarning ? 'warning' : ''
          }`}>
            ⏱️ {timer.formatTime()}
          </div>
        )}

        {isPracticeMode && isPerSectionTimer && (
          <span className="text-success font-bold">{correctSoFar} ✓</span>
        )}
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col">
        {/* Question Stem */}
        <div className="question-card mb-4">
          {renderVisual()}
          <p className={`text-lg font-medium leading-relaxed ${hasVisual || hasNSVisual ? 'text-center text-sm text-text-secondary' : ''}`}>
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
              let btnClass = 'option-btn w-full p-4 rounded-xl text-right cursor-pointer';

              if (showResult) {
                if (idx === currentQuestion.correctOption) {
                  btnClass += isPracticeMode ? ' correct juice-burst' : ' correct';
                } else if (idx === selectedOption && idx !== currentQuestion.correctOption) {
                  btnClass += isPracticeMode ? ' wrong bomb-explode' : ' wrong';
                } else {
                  btnClass += ' opacity-40';
                }
              } else if (selectedOption === idx) {
                btnClass += ' selected';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={selectedOption !== null}
                  className={btnClass}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 text-sm font-bold transition-colors ${
                      showResult && idx === currentQuestion.correctOption
                        ? 'bg-success text-white border-success'
                        : showResult && idx === selectedOption && idx !== currentQuestion.correctOption
                        ? 'bg-danger text-white border-danger'
                        : selectedOption === idx
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-text-secondary'
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

        {/* Practice Mode: Result & Explanation */}
        {isPracticeMode && showResult && currentSQ && (
          <div className="mb-4 animate-slide-up">
            <div className={`p-4 rounded-xl mb-3 ${
              timedOut ? 'result-wrong' :
              currentSQ.isCorrect ? 'result-correct' : 'result-wrong'
            }`}>
              <div className="font-bold text-lg mb-1">
                {feedbackMsg}
              </div>
              {!timedOut && currentSQ.isCorrect && combo >= 3 && (
                <div className="text-sm text-warning font-bold mb-1">
                  🔥 רצף של {combo} תשובות נכונות!
                </div>
              )}
              {!showExplanation && (
                <button
                  onClick={() => setShowExplanation(true)}
                  className="text-primary-light text-sm underline cursor-pointer"
                >
                  הראה הסבר
                </button>
              )}
              {showExplanation && (
                <div className="mt-2">
                  {/* Diagram in explanation for shapes/NS questions (item 7) */}
                  {(hasVisual || hasNSVisual) && (
                    <div className="mb-2 p-2 rounded-lg bg-black/20">
                      <div className="text-xs text-text-secondary mb-1 text-center">תרשים לעיון:</div>
                      {renderVisual(true)}
                    </div>
                  )}
                  <p className="text-sm text-text-secondary whitespace-pre-line">{currentQuestion.explanation}</p>
                </div>
              )}
            </div>

            <button
              onClick={advanceQuestion}
              className="btn-game w-full text-lg"
            >
              {currentQuestionIdx < currentSection.questions.length - 1 ? 'שאלה הבאה ←' : 'סיום ⚔️'}
            </button>
          </div>
        )}

        {/* Exam mode: Next button (shown after selection) */}
        {!isPracticeMode && selectedOption !== null && !showResult && (
          <button
            onClick={advanceQuestion}
            className="btn-game w-full text-lg mb-4"
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
