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
      color: 'bg-primary',
      onClick: () => onNavigate('practice_setup'),
    },
    {
      title: 'חיזוק חכם',
      subtitle: 'תרגול ממוקד בנושאים שצריך לחזק',
      icon: '🧠',
      color: 'bg-success',
      onClick: onStartAdaptive,
    },
    {
      title: 'מבחן מקוצר',
      subtitle: 'כמה פרקים נבחרים בזמן קצר',
      icon: '⏱️',
      color: 'bg-warning',
      onClick: () => onNavigate('mini_exam_setup'),
    },
    {
      title: 'מבחן מלא',
      subtitle: 'סימולציה מלאה כמו במבחן אמיתי',
      icon: '📋',
      color: 'bg-purple',
      onClick: onStartFullExam,
    },
    {
      title: 'ההצלחות שלי',
      subtitle: 'ראה את ההתקדמות והכוכבים שלך',
      icon: '⭐',
      color: 'bg-warning',
      onClick: () => onNavigate('achievements'),
    },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          שלום {childName}! 👋
        </h1>
        <p className="text-text-secondary text-lg">
          מוכן לתרגל היום?
        </p>
      </div>

      {/* Quick Stats */}
      {hasHistory && (
        <div className="bg-card rounded-2xl p-4 mb-6 shadow-sm border border-border">
          <div className="flex justify-around text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{sessions.length}</div>
              <div className="text-xs text-text-secondary">אימונים</div>
            </div>
            <div className="w-px bg-border"></div>
            <div>
              <div className="text-2xl font-bold text-success">
                {sessions.filter(s => s.totalScore !== undefined && s.totalScore >= 70).length}
              </div>
              <div className="text-xs text-text-secondary">הצלחות</div>
            </div>
            <div className="w-px bg-border"></div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {Math.round(sessions.reduce((sum, s) => sum + (s.totalTimeSec || 0), 0) / 60)}
              </div>
              <div className="text-xs text-text-secondary">דקות תרגול</div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="space-y-3">
        {menuItems.map((item, i) => (
          <button
            key={i}
            onClick={item.onClick}
            className="card-hover w-full bg-card rounded-2xl p-4 shadow-sm border border-border text-right flex items-center gap-4 cursor-pointer"
          >
            <div className={`w-14 h-14 ${item.color} rounded-xl flex items-center justify-center text-2xl shrink-0`}>
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg text-text">{item.title}</div>
              <div className="text-sm text-text-secondary">{item.subtitle}</div>
            </div>
            <div className="text-text-secondary text-xl">←</div>
          </button>
        ))}
      </div>

      {/* Parent Access */}
      <div className="mt-8 text-center">
        <button
          onClick={() => onNavigate('parent_login')}
          className="text-text-secondary text-sm underline cursor-pointer hover:text-primary"
        >
          כניסת הורים 🔒
        </button>
      </div>
    </div>
  );
}
