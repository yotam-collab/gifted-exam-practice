import { useState } from 'react';
import type { SectionType, Difficulty, TimerMode } from '../types';
import { SECTION_CONFIGS } from '../config/sections';

interface Props {
  onBack: () => void;
  onStart: (section: SectionType, difficulty: Difficulty, count: number, timer: TimerMode) => void;
}

// Defaults are tuned for fastest "tap and go" practice:
//   • adaptive difficulty (hardest available, system picks per-skill)
//   • max question count (20)
//   • per-question timer (mirrors real Stage B pacing)
const DEFAULT_DIFFICULTY: Difficulty = 'adaptive';
const DEFAULT_COUNT = 20;
const DEFAULT_TIMER: TimerMode = 'per_question';

export default function PracticeSetup({ onBack, onStart }: Props) {
  const [section, setSection] = useState<SectionType | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(DEFAULT_DIFFICULTY);
  const [questionCount, setQuestionCount] = useState(DEFAULT_COUNT);
  const [timerMode, setTimerMode] = useState<TimerMode>(DEFAULT_TIMER);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const difficulties: { value: Difficulty; label: string; desc: string }[] = [
    { value: 'easy', label: 'קל', desc: 'שאלות בסיסיות' },
    { value: 'medium', label: 'בינוני', desc: 'כמו במבחן' },
    { value: 'hard', label: 'מאתגר', desc: 'שאלות קשות' },
    { value: 'adaptive', label: 'אדפטיבי', desc: 'מתאים לרמה שלך' },
  ];

  const counts = [5, 10, 15, 20];

  const timerModes: { value: TimerMode; label: string; icon: string }[] = [
    { value: 'none', label: 'בלי זמן', icon: '🍃' },
    { value: 'per_question', label: 'זמן לשאלה', icon: '⏱️' },
    { value: 'per_section', label: 'זמן לפרק', icon: '⏰' },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 min-h-screen relative page-enter">
      <div className="bg-shapes">
        <div className="bg-shape" style={{ width: 200, height: 200, top: '5%', left: '-10%', background: '#E85D3A' }} />
        <div className="bg-shape" style={{ width: 150, height: 150, bottom: '20%', right: '-5%', background: '#27AE60', animationDelay: '3s' }} />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <button onClick={onBack} className="text-2xl cursor-pointer hover:opacity-70 text-primary-light">→</button>
        <h1 className="text-2xl font-extrabold text-glow">תרגול לפי נושא</h1>
      </div>

      {/* Section Selection */}
      <div className="mb-4 relative z-10">
        <h2 className="text-base font-semibold mb-2 text-text-secondary">בחר נושא:</h2>
        <div className="grid grid-cols-2 gap-3">
          {SECTION_CONFIGS.map((s) => (
            <button
              key={s.type}
              onClick={() => setSection(s.type)}
              className={`section-card ${section === s.type ? 'active' : ''}`}
            >
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className="font-semibold text-sm">{s.nameHe}</div>
            </button>
          ))}
        </div>
      </div>

      {section && (
        <div className="animate-slide-up relative z-10">
          {/* PRIMARY CTA — surfaces immediately so the kid can tap and start.
              Defaults are tuned for the most useful practice (adaptive + 20 + per-Q timer);
              advanced users can expand to tweak. */}
          <button
            onClick={() => onStart(section, difficulty, questionCount, timerMode)}
            className="btn-game w-full text-lg py-4 mb-4"
          >
            התחל תרגול! ⚔️
          </button>

          {/* Quick summary of what's set up */}
          <div className="text-xs text-text-secondary text-center mb-3 leading-relaxed">
            רמה: <b className="text-primary-light">{difficulties.find(d=>d.value===difficulty)?.label}</b>
            {' · '}
            <b className="text-primary-light">{questionCount}</b> שאלות
            {' · '}
            <b className="text-primary-light">{timerModes.find(t=>t.value===timerMode)?.label}</b>
          </div>

          {/* Toggle to reveal advanced controls — tap-friendly chevron */}
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="w-full text-sm text-text-secondary mb-4 cursor-pointer hover:text-primary-light transition-colors py-2"
          >
            {showAdvanced ? '▲ הסתר הגדרות' : '▼ שנה הגדרות (רמה / מספר / טיימר)'}
          </button>

          {showAdvanced && (
            <div className="animate-slide-up">
              {/* Difficulty */}
              <div className="mb-5">
                <h2 className="text-base font-semibold mb-2 text-text-secondary">רמת קושי:</h2>
                <div className="grid grid-cols-2 gap-2">
                  {difficulties.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDifficulty(d.value)}
                      className={`section-card ${difficulty === d.value ? 'active' : ''}`}
                    >
                      <div className="font-semibold text-sm">{d.label}</div>
                      <div className="text-xs text-text-secondary">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div className="mb-5">
                <h2 className="text-base font-semibold mb-2 text-text-secondary">מספר שאלות:</h2>
                <div className="flex gap-3">
                  {counts.map((c) => (
                    <button
                      key={c}
                      onClick={() => setQuestionCount(c)}
                      className={`flex-1 py-3 rounded-xl border-2 text-center cursor-pointer font-bold transition-all ${
                        questionCount === c
                          ? 'border-primary bg-primary/15 text-primary-light shadow-[0_0_15px_rgba(232,93,58,0.2)]'
                          : 'border-border bg-card hover:border-primary/30'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timer Mode */}
              <div className="mb-6">
                <h2 className="text-base font-semibold mb-2 text-text-secondary">טיימר:</h2>
                <div className="space-y-2">
                  {timerModes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTimerMode(t.value)}
                      className={`w-full p-3 rounded-xl border-2 text-right cursor-pointer flex items-center gap-3 transition-all ${
                        timerMode === t.value
                          ? 'border-primary bg-primary/15 shadow-[0_0_15px_rgba(232,93,58,0.2)]'
                          : 'border-border bg-card hover:border-primary/30'
                      }`}
                    >
                      <span className="text-xl">{t.icon}</span>
                      <span className="font-semibold">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
