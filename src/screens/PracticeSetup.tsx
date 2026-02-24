import React, { useState } from 'react';
import type { SectionType, Difficulty, TimerMode } from '../types';
import { SECTION_CONFIGS } from '../config/sections';

interface Props {
  onBack: () => void;
  onStart: (section: SectionType, difficulty: Difficulty, count: number, timer: TimerMode) => void;
}

export default function PracticeSetup({ onBack, onStart }: Props) {
  const [section, setSection] = useState<SectionType | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [timerMode, setTimerMode] = useState<TimerMode>('none');

  const difficulties: { value: Difficulty; label: string; desc: string }[] = [
    { value: 'easy', label: 'קל', desc: 'שאלות בסיסיות' },
    { value: 'medium', label: 'בינוני', desc: 'כמו במבחן' },
    { value: 'hard', label: 'מאתגר', desc: 'שאלות קשות' },
    { value: 'adaptive', label: 'אדפטיבי', desc: 'מתאים לרמה שלך' },
  ];

  const counts = [5, 10, 15, 20];

  const timerModes: { value: TimerMode; label: string }[] = [
    { value: 'none', label: 'בלי זמן' },
    { value: 'per_question', label: 'זמן לשאלה' },
    { value: 'per_section', label: 'זמן לפרק' },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-2xl cursor-pointer hover:opacity-70">→</button>
        <h1 className="text-2xl font-bold">תרגול לפי נושא</h1>
      </div>

      {/* Section Selection */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">בחר נושא:</h2>
        <div className="grid grid-cols-2 gap-3">
          {SECTION_CONFIGS.map((s) => (
            <button
              key={s.type}
              onClick={() => setSection(s.type)}
              className={`card-hover p-4 rounded-xl border-2 text-center cursor-pointer ${
                section === s.type
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              }`}
            >
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-semibold text-sm">{s.nameHe}</div>
            </button>
          ))}
        </div>
      </div>

      {section && (
        <>
          {/* Difficulty */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">רמת קושי:</h2>
            <div className="grid grid-cols-2 gap-2">
              {difficulties.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`p-3 rounded-xl border-2 text-center cursor-pointer ${
                    difficulty === d.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="font-semibold text-sm">{d.label}</div>
                  <div className="text-xs text-text-secondary">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">מספר שאלות:</h2>
            <div className="flex gap-3">
              {counts.map((c) => (
                <button
                  key={c}
                  onClick={() => setQuestionCount(c)}
                  className={`flex-1 py-3 rounded-xl border-2 text-center cursor-pointer font-bold ${
                    questionCount === c
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Timer Mode */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">טיימר:</h2>
            <div className="space-y-2">
              {timerModes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTimerMode(t.value)}
                  className={`w-full p-3 rounded-xl border-2 text-right cursor-pointer ${
                    timerMode === t.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <span className="font-semibold">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={() => onStart(section, difficulty, questionCount, timerMode)}
            className="w-full py-4 bg-primary text-white text-lg font-bold rounded-2xl cursor-pointer hover:bg-primary-dark transition-colors shadow-lg"
          >
            התחל תרגול! 🚀
          </button>
        </>
      )}
    </div>
  );
}
