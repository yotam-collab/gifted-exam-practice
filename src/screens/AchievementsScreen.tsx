import React from 'react';
import { storage } from '../services/storage';
import { SECTION_CONFIGS } from '../config/sections';

interface Props {
  userId: string;
  onBack: () => void;
}

export default function AchievementsScreen({ userId, onBack }: Props) {
  const sessions = storage.getSessions(userId);
  const stats = storage.getSkillStats(userId);

  const totalSessions = sessions.length;
  const totalQuestions = sessions.reduce(
    (sum, s) => sum + s.sections.reduce((ss, sec) => ss + sec.questions.length, 0), 0
  );
  const totalCorrect = sessions.reduce(
    (sum, s) => sum + s.sections.reduce((ss, sec) => ss + sec.questions.filter(q => q.isCorrect).length, 0), 0
  );
  const totalMinutes = Math.round(
    sessions.reduce((sum, s) => sum + (s.totalTimeSec || 0), 0) / 60
  );

  // Achievements
  const achievements = [
    { icon: '🌟', title: 'צעד ראשון', desc: 'השלם תרגול ראשון', unlocked: totalSessions >= 1 },
    { icon: '🔥', title: 'על גלגלים', desc: 'השלם 5 תרגולים', unlocked: totalSessions >= 5 },
    { icon: '💎', title: 'מתרגל מסור', desc: 'השלם 10 תרגולים', unlocked: totalSessions >= 10 },
    { icon: '🎯', title: 'חד-עין', desc: 'ענה נכון על 50 שאלות', unlocked: totalCorrect >= 50 },
    { icon: '🏆', title: 'אלוף', desc: 'קבל 90% ומעלה במבחן', unlocked: sessions.some(s => (s.totalScore || 0) >= 90) },
    { icon: '⚡', title: 'בזק', desc: 'תרגל 30 דקות סה"כ', unlocked: totalMinutes >= 30 },
    { icon: '🧠', title: 'חכם על', desc: 'שלוט ב-3 מיומנויות', unlocked: stats.filter(s => s.masteryScore >= 80).length >= 3 },
    { icon: '🌈', title: 'מגוון', desc: 'תרגל את כל 5 הנושאים', unlocked: SECTION_CONFIGS.every(sc => sessions.some(s => s.sections.some(sec => sec.sectionType === sc.type))) },
  ];

  // Section mastery
  const sectionMastery = SECTION_CONFIGS.map(sc => {
    const sectionStats = stats.filter(s => s.sectionType === sc.type);
    const avgMastery = sectionStats.length > 0
      ? Math.round(sectionStats.reduce((sum, s) => sum + s.masteryScore, 0) / sectionStats.length)
      : 0;
    return { config: sc, mastery: avgMastery };
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-2xl cursor-pointer hover:opacity-70">→</button>
        <h1 className="text-2xl font-bold">ההצלחות שלי ⭐</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <div className="text-2xl font-bold text-primary">{totalSessions}</div>
          <div className="text-xs text-text-secondary">אימונים</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <div className="text-2xl font-bold text-success">{totalCorrect}</div>
          <div className="text-xs text-text-secondary">תשובות נכונות</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <div className="text-2xl font-bold text-warning">{totalMinutes}</div>
          <div className="text-xs text-text-secondary">דקות תרגול</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <div className="text-2xl font-bold text-purple">{totalQuestions}</div>
          <div className="text-xs text-text-secondary">שאלות סה"כ</div>
        </div>
      </div>

      {/* Section Progress */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border mb-6">
        <h3 className="font-bold mb-3">רמת שליטה לפי נושא:</h3>
        <div className="space-y-3">
          {sectionMastery.map(sm => (
            <div key={sm.config.type}>
              <div className="flex justify-between text-sm mb-1">
                <span>{sm.config.icon} {sm.config.nameHe}</span>
                <span className="font-bold">{sm.mastery}%</span>
              </div>
              <div className="w-full h-3 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full progress-fill"
                  style={{ width: `${sm.mastery}%`, backgroundColor: sm.config.color }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <h3 className="font-bold text-lg mb-3">הישגים:</h3>
      <div className="grid grid-cols-2 gap-3">
        {achievements.map((a, i) => (
          <div
            key={i}
            className={`bg-card rounded-xl p-3 border text-center ${
              a.unlocked ? 'border-warning' : 'border-border opacity-50'
            }`}
          >
            <div className="text-3xl mb-1">{a.unlocked ? a.icon : '🔒'}</div>
            <div className="font-bold text-sm">{a.title}</div>
            <div className="text-xs text-text-secondary">{a.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
