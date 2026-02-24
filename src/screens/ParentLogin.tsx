import React, { useState } from 'react';
import { storage } from '../services/storage';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

export default function ParentLogin({ onBack, onSuccess }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    const settings = storage.getSettings();
    if (pin === settings.parentPin) {
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleDigit = (d: string) => {
    if (pin.length < 4) {
      const newPin = pin + d;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => {
          const settings = storage.getSettings();
          if (newPin === settings.parentPin) {
            onSuccess();
          } else {
            setError(true);
            setPin('');
            setTimeout(() => setError(false), 2000);
          }
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-6 min-h-screen flex flex-col items-center justify-center">
      <button
        onClick={onBack}
        className="self-start text-2xl cursor-pointer hover:opacity-70 mb-8"
      >
        →
      </button>

      <div className="text-4xl mb-4">🔒</div>
      <h1 className="text-xl font-bold mb-2">כניסת הורים</h1>
      <p className="text-text-secondary text-sm mb-6">הקלד קוד (ברירת מחדל: 1234)</p>

      {/* PIN dots */}
      <div className="flex gap-4 mb-6" dir="ltr">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all ${
              i < pin.length
                ? error ? 'bg-danger scale-110' : 'bg-primary scale-110'
                : 'bg-border'
            }`}
          ></div>
        ))}
      </div>

      {error && (
        <p className="text-danger text-sm mb-4">קוד שגוי, נסה שוב</p>
      )}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3 w-64" dir="ltr">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button
            key={n}
            onClick={() => handleDigit(String(n))}
            className="w-16 h-16 rounded-2xl bg-card border border-border text-xl font-bold cursor-pointer hover:bg-gray-50 transition-colors mx-auto"
          >
            {n}
          </button>
        ))}
        <div></div>
        <button
          onClick={() => handleDigit('0')}
          className="w-16 h-16 rounded-2xl bg-card border border-border text-xl font-bold cursor-pointer hover:bg-gray-50 transition-colors mx-auto"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="w-16 h-16 rounded-2xl text-xl cursor-pointer hover:bg-gray-50 transition-colors mx-auto"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
