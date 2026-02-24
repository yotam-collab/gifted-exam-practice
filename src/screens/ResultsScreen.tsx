import React, { useState } from 'react';
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

  const sessions = storage.getSessions(userId);
  const session = sessions.find(s => s.id === sessionId);

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

  // Find strong and weak sections
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
    if (score >= 90) return '🌟';
    if (score >= 70) return '👏';
    if (score >= 50) return '💪';
    return '🎯';
  };

  const getMessage = (score: number) => {
    if (score >= 90) return 'מדהים! עבודה מצוינת!';
    if (score >= 70) return 'כל הכבוד! התקדמות יפה!';
    if (score >= 50) return 'עבודה טובה! נמשיך להתאמן!';
    return 'אל תוותר! כל תרגול מחזק אותך!';
  };

  const getQuestion = (questionId: string): Question | undefined => {
    return questionBank.find(q => q.id === questionId);
  };

  const toggleQuestion = (sqId: string) => {
    setExpandedQuestion(prev => prev === sqId ? null : sqId);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
      {/* Score Circle */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-3">{getEmoji(score)}</div>
        <div className="relative w-32 h-32 mx-auto mb-3">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#E2E8F0" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={score >= 70 ? '#059669' : score >= 50 ? '#D97706' : '#DC2626'}
              strokeWidth="8"
              strokeDasharray={`${score * 2.83} 283`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold">{score}%</span>
          </div>
        </div>
        <h2 className="text-xl font-bold mb-1">{getMessage(score)}</h2>
        <p className="text-text-secondary">
          {totalCorrect} מתוך {totalQuestions} תשובות נכונות
        </p>
        <p className="text-sm text-text-secondary">
          זמן כולל: {Math.floor(totalTime / 60)} דקות ו-{totalTime % 60} שניות
        </p>
      </div>

      {/* Section Breakdown */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border mb-4">
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
                <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full progress-fill"
                    style={{ width: `${sr.pct}%`, backgroundColor: sr.config.color }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What went well */}
      {strongSections.length > 0 && (
        <div className="bg-green-50 rounded-2xl p-4 border border-success mb-4">
          <h3 className="font-bold text-success mb-2">מה הלך מעולה 🌟</h3>
          <ul className="text-sm space-y-1">
            {strongSections.map(s => (
              <li key={s.type}>{s.config.icon} {s.config.nameHe} - {s.pct}% הצלחה!</li>
            ))}
          </ul>
        </div>
      )}

      {/* What to practice */}
      {weakSections.length > 0 && (
        <div className="bg-blue-50 rounded-2xl p-4 border border-primary mb-4">
          <h3 className="font-bold text-primary mb-2">מה נתרגל בפעם הבאה 📚</h3>
          <ul className="text-sm space-y-1">
            {weakSections.map(s => (
              <li key={s.type}>{s.config.icon} {s.config.nameHe} - כדאי לתרגל עוד</li>
            ))}
          </ul>
        </div>
      )}

      {/* Question Review Button */}
      <button
        onClick={() => setShowReview(!showReview)}
        className="w-full py-3 bg-card border-2 border-primary text-primary font-bold rounded-xl cursor-pointer hover:bg-blue-50 transition-colors mb-4"
      >
        {showReview ? 'הסתר ניתוח שאלות' : 'נתח שאלות 🔍'}
      </button>

      {/* Question Review Section */}
      {showReview && (
        <div className="space-y-6 mb-6">
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
                      className={`bg-card rounded-xl border-2 overflow-hidden transition-all ${
                        isCorrect ? 'border-success' : 'border-danger'
                      }`}
                    >
                      {/* Question header - clickable */}
                      <button
                        onClick={() => toggleQuestion(sq.id)}
                        className="w-full p-3 flex items-center gap-3 text-right cursor-pointer hover:bg-gray-50 transition-colors"
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
                        <div className="px-3 pb-3 border-t border-border">
                          {/* Full question */}
                          <div className="py-3">
                            <p className="text-sm font-medium mb-3 leading-relaxed">{question.stem}</p>

                            {/* Options */}
                            <div className="space-y-2">
                              {question.options.map((opt, optIdx) => {
                                const isThisCorrect = optIdx === question.correctOption;
                                const isThisSelected = optIdx === sq.selectedOption;

                                let optClass = 'p-2.5 rounded-lg text-sm flex items-center gap-2 border ';

                                if (isThisCorrect && isThisSelected) {
                                  optClass += 'bg-green-50 border-success text-success font-bold';
                                } else if (isThisCorrect) {
                                  optClass += 'bg-green-50 border-success text-success';
                                } else if (isThisSelected && !isThisCorrect) {
                                  optClass += 'bg-red-50 border-danger text-danger line-through';
                                } else {
                                  optClass += 'bg-gray-50 border-gray-200 text-text-secondary';
                                }

                                return (
                                  <div key={optIdx} className={optClass}>
                                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold ${
                                      isThisCorrect
                                        ? 'bg-success text-white border-success'
                                        : isThisSelected
                                        ? 'bg-danger text-white border-danger'
                                        : 'border-gray-300 text-text-secondary'
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

                            {/* Not answered indicator */}
                            {!wasAnswered && (
                              <div className="mt-2 p-2 bg-orange-50 rounded-lg text-sm text-warning font-medium">
                                לא נענתה
                              </div>
                            )}

                            {/* Time spent */}
                            {sq.timeSpentSec !== undefined && (
                              <div className="mt-2 text-xs text-text-secondary">
                                זמן תשובה: {sq.timeSpentSec} שניות
                              </div>
                            )}
                          </div>

                          {/* Explanation */}
                          <div className={`p-3 rounded-lg text-sm ${
                            isCorrect ? 'bg-green-50' : 'bg-blue-50'
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
      <div className="space-y-3 mt-6">
        <button
          onClick={onPracticeAgain}
          className="w-full py-3 bg-primary text-white font-bold rounded-xl cursor-pointer hover:bg-primary-dark transition-colors"
        >
          תרגול נוסף 🚀
        </button>
        <button
          onClick={onHome}
          className="w-full py-3 bg-card border-2 border-border text-text font-bold rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
        >
          חזרה למסך הבית 🏠
        </button>
      </div>
    </div>
  );
}
