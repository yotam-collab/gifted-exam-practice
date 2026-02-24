import React, { useState } from 'react';
import type { SectionType } from '../types';
import { SECTION_CONFIGS } from '../config/sections';

interface Props {
  onBack: () => void;
  onStart: (sections: SectionType[], questionsPerSection: number, useTimer: boolean) => void;
}

export default function MiniExamSetup({ onBack, onStart }: Props) {
  const [selectedSections, setSelectedSections] = useState<SectionType[]>([]);
  const [questionsPerSection, setQuestionsPerSection] = useState(5);
  const [useTimer, setUseTimer] = useState(true);

  const toggleSection = (type: SectionType) => {
    setSelectedSections((prev) =>
      prev.includes(type) ? prev.filter((s) => s !== type) : [...prev, type]
    );
  };

  const counts = [3, 5, 8, 10];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 min-h-screen relative">
      <div className="bg-shapes">
        <div className="bg-shape" style={{ width: 200, height: 200, top: '10%', right: '-10%', background: '#A855F7' }} />
        <div className="bg-shape" style={{ width: 150, height: 150, bottom: '15%', left: '-5%', background: '#00CEC9', animationDelay: '2s' }} />
      </div>

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <button onClick={onBack} className="text-2xl cursor-pointer hover:opacity-70 text-primary-light">→</button>
        <h1 className="text-2xl font-extrabold text-glow">מבחן מקוצר</h1>
      </div>

      {/* Section Selection */}
      <div className="mb-6 relative z-10">
        <h2 className="text-lg font-semibold mb-3 text-text-secondary">בחר פרקים (2-5):</h2>
        <div className="space-y-2">
          {SECTION_CONFIGS.map((s) => (
            <button
              key={s.type}
              onClick={() => toggleSection(s.type)}
              className={`menu-item w-full p-3 flex items-center gap-3 ${
                selectedSections.includes(s.type)
                  ? '!border-primary !bg-primary/10'
                  : ''
              }`}
            >
              <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all ${
                selectedSections.includes(s.type) ? 'bg-primary border-primary text-white' : 'border-border text-text-secondary'
              }`}>
                {selectedSections.includes(s.type) && '✓'}
              </div>
              <span className="text-xl">{s.icon}</span>
              <span className="font-semibold">{s.nameHe}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Questions per section */}
      <div className="mb-6 relative z-10">
        <h2 className="text-lg font-semibold mb-3 text-text-secondary">שאלות לפרק:</h2>
        <div className="flex gap-3">
          {counts.map((c) => (
            <button
              key={c}
              onClick={() => setQuestionsPerSection(c)}
              className={`flex-1 py-3 rounded-xl border-2 text-center cursor-pointer font-bold transition-all ${
                questionsPerSection === c
                  ? 'border-primary bg-primary/15 text-primary-light shadow-[0_0_15px_rgba(108,92,231,0.2)]'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Timer toggle */}
      <div className="mb-8 relative z-10">
        <div className="game-card p-4 flex items-center justify-between">
          <span className="font-semibold">עם טיימר ⏱️</span>
          <button
            onClick={() => setUseTimer(!useTimer)}
            className={`w-14 h-8 rounded-full transition-all cursor-pointer ${
              useTimer ? 'bg-primary shadow-[0_0_10px_rgba(108,92,231,0.4)]' : 'bg-border'
            }`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform mx-1 mt-1 ${
              useTimer ? '-translate-x-6' : 'translate-x-0'
            }`}></div>
          </button>
        </div>
      </div>

      {/* Start */}
      <div className="relative z-10">
        <button
          onClick={() => onStart(selectedSections, questionsPerSection, useTimer)}
          disabled={selectedSections.length < 2}
          className={`w-full py-4 text-lg font-bold rounded-2xl cursor-pointer transition-all ${
            selectedSections.length >= 2
              ? 'btn-game'
              : 'bg-border text-text-secondary cursor-not-allowed'
          }`}
        >
          {selectedSections.length < 2 ? 'בחר לפחות 2 פרקים' : 'התחל מבחן מקוצר! ⏱️'}
        </button>
      </div>
    </div>
  );
}
