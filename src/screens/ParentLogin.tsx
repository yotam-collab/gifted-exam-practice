import { useState } from 'react';
import { storage } from '../services/storage';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

export default function ParentLogin({ onBack, onSuccess }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

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
    <div className="max-w-sm mx-auto px-4 py-6 min-h-screen flex flex-col items-center justify-center relative">
      <div className="bg-shapes">
        <div className="bg-shape" style={{ width: 200, height: 200, top: '10%', right: '-10%', background: '#6C5CE7' }} />
        <div className="bg-shape" style={{ width: 150, height: 150, bottom: '20%', left: '-5%', background: '#A855F7', animationDelay: '3s' }} />
      </div>

      <button
        onClick={onBack}
        className="self-start text-2xl cursor-pointer hover:opacity-70 mb-8 text-primary-light relative z-10"
      >
        →
      </button>

      <div className="text-5xl mb-4 animate-float relative z-10">🔒</div>
      <h1 className="text-xl font-extrabold mb-2 text-glow relative z-10">כניסת הורים</h1>
      <p className="text-text-secondary text-sm mb-6 relative z-10">הקלד קוד (ברירת מחדל: 1234)</p>

      {/* PIN dots */}
      <div className="flex gap-4 mb-6 relative z-10" dir="ltr">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all ${
              i < pin.length
                ? error ? 'bg-danger scale-125 shadow-[0_0_10px_rgba(255,107,107,0.5)]' : 'bg-primary scale-125 shadow-[0_0_10px_rgba(108,92,231,0.5)]'
                : 'bg-border'
            }`}
          ></div>
        ))}
      </div>

      {error && (
        <p className="text-danger text-sm mb-4 animate-bounce-in relative z-10">קוד שגוי, נסה שוב</p>
      )}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3 w-64 relative z-10" dir="ltr">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button
            key={n}
            onClick={() => handleDigit(String(n))}
            className="w-16 h-16 rounded-2xl bg-card border border-border text-xl font-bold cursor-pointer hover:border-primary hover:shadow-[0_0_10px_rgba(108,92,231,0.2)] transition-all mx-auto"
          >
            {n}
          </button>
        ))}
        <div></div>
        <button
          onClick={() => handleDigit('0')}
          className="w-16 h-16 rounded-2xl bg-card border border-border text-xl font-bold cursor-pointer hover:border-primary hover:shadow-[0_0_10px_rgba(108,92,231,0.2)] transition-all mx-auto"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="w-16 h-16 rounded-2xl text-xl cursor-pointer hover:bg-card transition-all mx-auto text-text-secondary"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
