import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { getSectionConfig } from '../config/sections';
import { questionBank } from '../data/questions';
import type { SessionQuestion, Question } from '../types';

interface Props {
  sessionId: string;
  userId: string;
  onHome: () => void;
  onPracticeAgain: () => void;
}

export default function ResultsScreen({ sessionId, userId, onHome, onPracticeAgain }: Props) {
  const [showReview, setShowReview] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [animateScore, setAnimateScore] = useState(false);

  const sessions = storage.getSessions(userId);
  const session = sessions.find(s => s.id === sessionId);

  useEffect(() => {
    setTimeout(() => setAnimateScore(true), 300);
  }, []);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>לא נמצאו תוצאות</p>
      </div>
    );
  }

  const totalQuestions = session.sections.reduce((sum, s) => sum + s.questions.length, 0);
  const totalCorrect = session.sections.reduce(
    (sum, s) => sum + s.questions.filter(q => q.isCorrect).length, 0
  );
  const score = session.totalScore || 0;
  const totalTime = session.totalTimeSec || 0;

  const sectionResults = session.sections.map(s => {
    const correct = s.questions.filter(q => q.isCorrect).length;
    const total = s.questions.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return {
      type: s.sectionType,
      config: getSectionConfig(s.sectionType),
      correct,
      total,
      pct,
      questions: s.questions,
    };
  });

  const strongSections = sectionResults.filter(s => s.pct >= 70);
  const weakSections = sectionResults.filter(s => s.pct < 70);

  const getEmoji = (score: number) => {
    if (score >= 90) return '🏆';
    if (score >= 70) return '🌟';
    if (score >= 50) return '💪';
    return '🎯';
  };

  const getMessage = (score: number) => {
    if (score >= 90) return 'מדהים! אלוף אמיתי!';
    if (score >= 70) return 'כל הכבוד! התקדמות מעולה!';
    if (score >= 50) return 'עבודה טובה! נמשיך להתאמן!';
    return 'אל תוותר! כל תרגול מחזק אותך!';
  };

  const getQuestion = (questionId: string): Question | undefined => {
    return questionBank.find(q => q.id === questionId);
  };

  const toggleQuestion = (sqId: string) => {
    setExpandedQuestion(prev => prev === sqId ? null : sqId);
  };

  const scoreColor = score >= 70 ? '#00B894' : score >= 50 ? '#FDCB6E' : '#FF6B6B';

  return (
    <div className="max-w-lg mx-auto px-4 py-6 min-h-screen relative">
      {/* Background decoration */}
      <div className="bg-shapes">
        <div className="bg-shape" style={{ width: 250, height: 250, top: '-5%', right: '-10%', background: scoreColor }} />
        <div className="bg-shape" style={{ width: 180, height: 180, bottom: '10%', left: '-5%', background: '#A855F7', animationDelay: '2s' }} />
      </div>

      {/* Score Circle */}
      <div className="text-center mb-6 relative z-10">
        <div className={`text-6xl mb-3 ${animateScore ? 'animate-bounce-in' : 'opacity-0'}`}>
          {getEmoji(score)}
        </div>
        <div className={`relative w-36 h-36 mx-auto mb-4 ${animateScore ? 'score-circle-glow' : 'opacity-0'}`}>
          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(61, 47, 107, 0.5)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={scoreColor}
              strokeWidth="6"
              strokeDasharray={`${animateScore ? score * 2.64 : 0} 264`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1.5s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="score-text">{score}%</span>
          </div>
        </div>
        <h2 className="text-xl font-extrabold mb-1 text-glow">{getMessage(score)}</h2>
        <p className="text-text-secondary">
          {totalCorrect} מתוך {totalQuestions} תשובות נכונות
        </p>
        <p className="text-sm text-text-secondary">
          זמן כולל: {Math.floor(totalTime / 60)} דקות ו-{totalTime % 60} שניות
        </p>
      </div>

      {/* Section Breakdown */}
      <div className="game-card p-4 mb-4 relative z-10">
        <h3 className="font-bold mb-3">פירוט לפי פרק:</h3>
        <div className="space-y-3">
          {sectionResults.map((sr) => (
            <div key={sr.type} className="flex items-center gap-3">
              <span className="text-xl">{sr.config.icon}</span>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{sr.config.nameHe}</span>
                  <span className="font-bold" style={{ color: sr.config.color }}>
                    {sr.correct}/{sr.total}
                  </span>
                </div>
                <div className="progress-track h-2">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${sr.pct}%`,
                      backgroundColor: sr.config.color,
                      boxShadow: `0 0 8px ${sr.config.color}40`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What went well */}
      {strongSections.length > 0 && (
        <div className="result-correct rounded-2xl p-4 mb-4 relative z-10">
          <h3 className="font-bold text-success mb-2 text-glow-success">מה הלך מעולה 🌟</h3>
          <ul className="text-sm space-y-1">
            {strongSections.map(s => (
              <li key={s.type}>{s.config.icon} {s.config.nameHe} - {s.pct}% הצלחה!</li>
            ))}
          </ul>
        </div>
      )}

      {/* What to practice */}
      {weakSections.length > 0 && (
        <div className="game-card p-4 mb-4 relative z-10" style={{ borderColor: 'rgba(168, 85, 247, 0.4)' }}>
          <h3 className="font-bold text-purple-light mb-2">מה נתרגל בפעם הבאה 📚</h3>
          <ul className="text-sm space-y-1 text-text-secondary">
            {weakSections.map(s => (
              <li key={s.type}>{s.config.icon} {s.config.nameHe} - כדאי לתרגל עוד</li>
            ))}
          </ul>
        </div>
      )}

      {/* Question Review Button */}
      <button
        onClick={() => setShowReview(!showReview)}
        className="w-full py-3 game-card border-2 border-primary text-primary-light font-bold rounded-xl cursor-pointer hover:border-primary-light transition-colors mb-4 relative z-10"
      >
        {showReview ? 'הסתר ניתוח שאלות' : 'נתח שאלות 🔍'}
      </button>

      {/* Question Review Section */}
      {showReview && (
        <div className="space-y-6 mb-6 relative z-10">
          {sectionResults.map((sr) => (
            <div key={sr.type}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{sr.config.icon}</span>
                <h3 className="font-bold text-lg">{sr.config.nameHe}</h3>
                <span className="text-sm text-text-secondary">
                  ({sr.correct}/{sr.total})
                </span>
              </div>

              <div className="space-y-2">
                {sr.questions.map((sq, qIdx) => {
                  const question = getQuestion(sq.questionId);
                  if (!question) return null;

                  const isExpanded = expandedQuestion === sq.id;
                  const isCorrect = sq.isCorrect;
                  const wasAnswered = sq.selectedOption !== undefined;

                  return (
                    <div
                      key={sq.id}
                      className={`rounded-xl border-2 overflow-hidden transition-all ${
                        isCorrect
                          ? 'border-success/40 bg-gradient-to-r from-[#0A3D2E]/50 to-transparent'
                          : 'border-danger/40 bg-gradient-to-r from-[#3D1520]/50 to-transparent'
                      }`}
                    >
                      {/* Question header - clickable */}
                      <button
                        onClick={() => toggleQuestion(sq.id)}
                        className="w-full p-3 flex items-center gap-3 text-right cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold ${
                          isCorrect ? 'bg-success' : 'bg-danger'
                        }`}>
                          {isCorrect ? '✓' : '✗'}
                        </div>
                        <div className="flex-1 text-sm font-medium truncate">
                          שאלה {qIdx + 1}: {question.stem.slice(0, 60)}{question.stem.length > 60 ? '...' : ''}
                        </div>
                        <span className="text-text-secondary text-lg shrink-0">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </button>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-border/50">
                          <div className="py-3">
                            <p className="text-sm font-medium mb-3 leading-relaxed">{question.stem}</p>

                            <div className="space-y-2">
                              {question.options.map((opt, optIdx) => {
                                const isThisCorrect = optIdx === question.correctOption;
                                const isThisSelected = optIdx === sq.selectedOption;

                                let optClass = 'p-2.5 rounded-lg text-sm flex items-center gap-2 border ';

                                if (isThisCorrect && isThisSelected) {
                                  optClass += 'bg-success/20 border-success text-success font-bold';
                                } else if (isThisCorrect) {
                                  optClass += 'bg-success/10 border-success/50 text-success';
                                } else if (isThisSelected && !isThisCorrect) {
                                  optClass += 'bg-danger/20 border-danger text-danger line-through';
                                } else {
                                  optClass += 'bg-card-light/30 border-border/30 text-text-secondary';
                                }

                                return (
                                  <div key={optIdx} className={optClass}>
                                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold ${
                                      isThisCorrect
                                        ? 'bg-success text-white border-success'
                                        : isThisSelected
                                        ? 'bg-danger text-white border-danger'
                                        : 'border-border text-text-secondary'
                                    }`}>
                                      {String.fromCharCode(1488 + optIdx)}
                                    </span>
                                    <span className="flex-1">{opt}</span>
                                    {isThisCorrect && (
                                      <span className="text-success text-xs font-bold shrink-0">תשובה נכונה</span>
                                    )}
                                    {isThisSelected && !isThisCorrect && (
                                      <span className="text-danger text-xs font-bold shrink-0">בחרת</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {!wasAnswered && (
                              <div className="mt-2 p-2 bg-warning/10 rounded-lg text-sm text-warning font-medium border border-warning/30">
                                לא נענתה
                              </div>
                            )}

                            {sq.timeSpentSec !== undefined && (
                              <div className="mt-2 text-xs text-text-secondary">
                                זמן תשובה: {sq.timeSpentSec} שניות
                              </div>
                            )}
                          </div>

                          <div className={`p-3 rounded-lg text-sm ${
                            isCorrect ? 'result-correct' : 'bg-primary/10 border border-primary/30'
                          }`}>
                            <div className="font-bold mb-1">
                              {isCorrect ? '✅ נכון!' : '💡 הסבר:'}
                            </div>
                            <p className="leading-relaxed">{question.explanation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 mt-6 relative z-10">
        <button
          onClick={onPracticeAgain}
          className="btn-game w-full text-lg"
        >
          תרגול נוסף 🚀
        </button>
        <button
          onClick={onHome}
          className="w-full py-3 game-card border-2 border-border text-text font-bold rounded-xl cursor-pointer hover:border-primary transition-colors"
        >
          חזרה למסך הבית 🏠
        </button>
      </div>
    </div>
  );
}
