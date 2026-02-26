// Fruit Ninja style sound effects using Web Audio API
class SoundService {
  private ctx: AudioContext | null = null;
  private enabled = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.2) {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Silently fail - audio may not be available
    }
  }

  /** Satisfying slice + cheerful rising chime */
  playCorrect() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      // Blade slice (white noise burst)
      const bufferSize = Math.floor(ctx.sampleRate * 0.08);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(4000, ctx.currentTime);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(ctx.currentTime);

      // Rising two-note chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(523, ctx.currentTime + 0.05); // C5
      osc1.frequency.setValueAtTime(659, ctx.currentTime + 0.15); // E5
      osc2.frequency.setValueAtTime(659, ctx.currentTime + 0.05); // E5
      osc2.frequency.setValueAtTime(784, ctx.currentTime + 0.15); // G5
      gain.gain.setValueAtTime(0.18, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(ctx.currentTime + 0.05);
      osc2.start(ctx.currentTime + 0.05);
      osc1.stop(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.4);
    } catch {
      // Silently fail
    }
  }

  /** Low descending bomb thud */
  playWrong() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Silently fail
    }
  }

  /** Ascending fanfare for combos */
  playCombo() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.07);
        osc.stop(ctx.currentTime + i * 0.07 + 0.2);
      });
    } catch {
      // Silently fail
    }
  }

  /** Quick tap for button selection */
  playTap() {
    this.playTone(600, 0.06, 'sine', 0.08);
  }

  /** Subtle tick for timer warning */
  playTimerTick() {
    this.playTone(880, 0.04, 'sine', 0.06);
  }

  /** Time's up buzzer */
  playTimeUp() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(330, ctx.currentTime);
      osc.frequency.setValueAtTime(220, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Silently fail
    }
  }
}

export const sounds = new SoundService();
