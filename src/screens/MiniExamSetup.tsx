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
    <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-2xl cursor-pointer hover:opacity-70">→</button>
        <h1 className="text-2xl font-bold">מבחן מקוצר</h1>
      </div>

      {/* Section Selection */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">בחר פרקים (2-5):</h2>
        <div className="space-y-2">
          {SECTION_CONFIGS.map((s) => (
            <button
              key={s.type}
              onClick={() => toggleSection(s.type)}
              className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer ${
                selectedSections.includes(s.type)
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              }`}
            >
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                selectedSections.includes(s.type) ? 'bg-primary border-primary text-white' : 'border-gray-300'
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
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">שאלות לפרק:</h2>
        <div className="flex gap-3">
          {counts.map((c) => (
            <button
              key={c}
              onClick={() => setQuestionsPerSection(c)}
              className={`flex-1 py-3 rounded-xl border-2 text-center cursor-pointer font-bold ${
                questionsPerSection === c
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-card'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Timer toggle */}
      <div className="mb-8">
        <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border">
          <span className="font-semibold">עם טיימר</span>
          <button
            onClick={() => setUseTimer(!useTimer)}
            className={`w-14 h-8 rounded-full transition-colors cursor-pointer ${
              useTimer ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform mx-1 mt-1 ${
              useTimer ? '-translate-x-6' : 'translate-x-0'
            }`}></div>
          </button>
        </div>
      </div>

      {/* Start */}
      <button
        onClick={() => onStart(selectedSections, questionsPerSection, useTimer)}
        disabled={selectedSections.length < 2}
        className={`w-full py-4 text-white text-lg font-bold rounded-2xl cursor-pointer transition-colors shadow-lg ${
          selectedSections.length >= 2
            ? 'bg-primary hover:bg-primary-dark'
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        {selectedSections.length < 2 ? 'בחר לפחות 2 פרקים' : 'התחל מבחן מקוצר! ⏱️'}
      </button>
    </div>
  );
}
