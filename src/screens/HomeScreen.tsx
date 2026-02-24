import React from 'react';
import type { AppView } from '../types';
import { storage } from '../services/storage';

interface Props {
  onNavigate: (view: AppView) => void;
  onStartAdaptive: () => void;
  onStartFullExam: () => void;
}

export default function HomeScreen({ onNavigate, onStartAdaptive, onStartFullExam }: Props) {
  const settings = storage.getSettings();
  const childName = settings.childName;
  const sessions = storage.getSessions('child_itamar');
  const hasHistory = sessions.length > 0;

  const menuItems = [
    {
      title: 'תרגול לפי נושא',
      subtitle: 'בחר נושא, רמת קושי ומספר שאלות',
      icon: '📚',
      gradient: 'from-purple-600 to-indigo-600',
      onClick: () => onNavigate('practice_setup'),
    },
    {
      title: 'חיזוק חכם',
      subtitle: 'תרגול ממוקד בנושאים שצריך לחזק',
      icon: '🧠',
      gradient: 'from-emerald-600 to-teal-600',
      onClick: onStartAdaptive,
    },
    {
      title: 'מבחן מקוצר',
      subtitle: 'כמה פרקים נבחרים בזמן קצר',
      icon: '⏱️',
      gradient: 'from-amber-500 to-orange-600',
      onClick: () => onNavigate('mini_exam_setup'),
    },
    {
      title: 'מבחן מלא',
      subtitle: 'סימולציה מלאה כמו במבחן אמיתי',
      icon: '📋',
      gradient: 'from-violet-600 to-purple-700',
      onClick: onStartFullExam,
    },
    {
      title: 'ההצלחות שלי',
      subtitle: 'ראה את ההתקדמות והכוכבים שלך',
      icon: '⭐',
      gradient: 'from-yellow-500 to-amber-600',
      onClick: () => onNavigate('achievements'),
    },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 min-h-screen relative">
      {/* Background Shapes */}
      <div className="bg-shapes">
        <div className="bg-shape" style={{ width: 300, height: 300, top: '-5%', right: '-10%', background: '#6C5CE7' }} />
        <div className="bg-shape" style={{ width: 200, height: 200, bottom: '10%', left: '-5%', background: '#A855F7', animationDelay: '2s' }} />
        <div className="bg-shape" style={{ width: 150, height: 150, top: '40%', right: '80%', background: '#00CEC9', animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <div className="text-center mb-8 relative z-10">
        <div className="text-5xl mb-3 animate-float">🚀</div>
        <h1 className="text-3xl font-extrabold text-glow mb-2 bg-gradient-to-l from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          שלום {childName}!
        </h1>
        <p className="text-text-secondary text-lg">
          מוכן למשימה חדשה?
        </p>
      </div>

      {/* Quick Stats */}
      {hasHistory && (
        <div className="game-card p-4 mb-6 animate-slide-up relative z-10">
          <div className="flex justify-around text-center">
            <div className="stat-badge flex-1">
              <div className="stat-value">{sessions.length}</div>
              <div className="text-xs text-text-secondary mt-1">אימונים</div>
            </div>
            <div className="stat-badge flex-1 mx-2">
              <div className="stat-value">
                {sessions.filter(s => s.totalScore !== undefined && s.totalScore >= 70).length}
              </div>
              <div className="text-xs text-text-secondary mt-1">הצלחות</div>
            </div>
            <div className="stat-badge flex-1">
              <div className="stat-value">
                {Math.round(sessions.reduce((sum, s) => sum + (s.totalTimeSec || 0), 0) / 60)}
              </div>
              <div className="text-xs text-text-secondary mt-1">דקות תרגול</div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="space-y-3 relative z-10">
        {menuItems.map((item, i) => (
          <button
            key={i}
            onClick={item.onClick}
            className="menu-item w-full p-4 text-right flex items-center gap-4"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className={`menu-icon bg-gradient-to-br ${item.gradient} shadow-lg`}>
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg text-text">{item.title}</div>
              <div className="text-sm text-text-secondary">{item.subtitle}</div>
            </div>
            <div className="text-primary-light text-xl">←</div>
          </button>
        ))}
      </div>

      {/* Parent Access */}
      <div className="mt-8 text-center relative z-10">
        <button
          onClick={() => onNavigate('parent_login')}
          className="text-text-secondary text-sm underline cursor-pointer hover:text-primary-light transition-colors"
        >
          כניסת הורים 🔒
        </button>
      </div>
    </div>
  );
}
