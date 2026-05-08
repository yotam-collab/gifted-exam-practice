// Hebrew gifted-exam practice — sound system.
// Web Audio synthesis (no asset files = zero load latency, infinite variety).
// Designed for 7-year-olds: short, expressive, never harsh, never grating.
//
// Key design rules:
//   • Every effect ducks down to silence within ~400 ms (no lingering tails).
//   • Volume capped at 0.22 master gain (no startle, even on max system volume).
//   • All effects respect this.enabled and gracefully no-op without a user gesture.
//   • Combos rise in pitch with streak length (gives "you're on fire" feedback).
type EffectName =
  | 'correct' | 'wrong' | 'combo' | 'tap' | 'tick' | 'timeUp'
  | 'hint' | 'sectionComplete' | 'levelUp' | 'whoosh' | 'star' | 'unlock';

class SoundService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = true;
  private masterVolume = 0.85;

  setEnabled(enabled: boolean) { this.enabled = enabled; }
  isEnabled() { return this.enabled; }
  setVolume(v: number) {
    this.masterVolume = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = this.masterVolume;
  }

  private getCtx(): AudioContext {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  /** Output destination (master gain → speakers). All sounds connect here. */
  private out(): AudioNode {
    this.getCtx();
    return this.masterGain!;
  }

  // ─── Primitive helpers ─────────────────────────────────────────────────

  private envelope(node: AudioNode, attack: number, peak: number, release: number, ctx: AudioContext, t0 = ctx.currentTime): GainNode {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + release);
    node.connect(g);
    g.connect(this.out());
    return g;
  }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.18, t0?: number): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const start = t0 ?? ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      this.envelope(osc, 0.005, volume, duration, ctx, start);
      osc.start(start);
      osc.stop(start + duration + 0.05);
    } catch { /* no-op */ }
  }

  private noise(duration: number, highpass: number, volume: number, t0?: number): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const start = t0 ?? ctx.currentTime;
      const len = Math.max(1, Math.floor(ctx.sampleRate * duration));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = highpass;
      const g = ctx.createGain();
      g.gain.setValueAtTime(volume, start);
      g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      src.connect(filter);
      filter.connect(g);
      g.connect(this.out());
      src.start(start);
      src.stop(start + duration + 0.02);
    } catch { /* no-op */ }
  }

  // ─── Public effects ───────────────────────────────────────────────────

  /** Bright two-note rising chime with a soft bell shimmer. Used for correct answer. */
  playCorrect(): void {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    // Whoosh in
    this.noise(0.08, 5500, 0.10, t);
    // Bell shimmer — two oscillators slightly detuned for warmth
    this.tone(523, 0.32, 'sine', 0.20, t + 0.04);  // C5
    this.tone(659, 0.34, 'triangle', 0.16, t + 0.10); // E5
    this.tone(1047, 0.20, 'sine', 0.08, t + 0.18); // C6 sparkle
  }

  /** Quick low descending thud + brief muted kick. Soft, never harsh. */
  playWrong(): void {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.32);
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
      osc.connect(g); g.connect(this.out());
      osc.start(t); osc.stop(t + 0.4);
    } catch { /* no-op */ }
    // Muted kick body
    this.tone(120, 0.18, 'sine', 0.1, t + 0.02);
  }

  /** Combo fanfare — pitch and length scale with streak. */
  playCombo(streak = 3): void {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const noteCount = Math.min(7, 3 + Math.floor((streak - 3) / 2));
    const baseFreq = 440;
    for (let i = 0; i < noteCount; i++) {
      const freq = baseFreq * Math.pow(2, i / 4); // quarter-step rise
      const start = t + i * 0.06;
      this.tone(freq, 0.18, i === noteCount - 1 ? 'triangle' : 'sine', 0.13, start);
    }
    // Sparkle on top
    this.tone(2093, 0.24, 'sine', 0.06, t + (noteCount - 1) * 0.06 + 0.05);
  }

  /** Quick clean tap for option selection. */
  playTap(): void { this.tone(720, 0.05, 'sine', 0.07); }

  /** Subtle metronome tick for timer warning. */
  playTimerTick(): void { this.tone(880, 0.04, 'sine', 0.06); }

  /** Two-tone alert when time's up — distinctive but not jarring. */
  playTimeUp(): void {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    this.tone(440, 0.16, 'square', 0.10, t);
    this.tone(330, 0.20, 'square', 0.09, t + 0.18);
  }

  /** Soft "tink" when a hint is used. Lighter than tap. */
  playHint(): void {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    this.tone(1320, 0.08, 'sine', 0.10, t);
    this.tone(1760, 0.06, 'sine', 0.06, t + 0.04);
  }

  /** Triumphant cascade for completing a section. ~600 ms. */
  playSectionComplete(): void {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    // Major arpeggio C E G C E G C
    const notes = [523, 659, 784, 1047, 1319, 1568, 2093];
    notes.forEach((f, i) => this.tone(f, 0.2, i % 2 === 0 ? 'sine' : 'triangle', 0.13, t + i * 0.07));
    this.noise(0.15, 4000, 0.06, t + 0.05);
  }

  /** Long celebratory chord + sparkle for level-up / mastery milestone. */
  playLevelUp(): void {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    // Major chord
    [523, 659, 784].forEach(f => this.tone(f, 0.6, 'triangle', 0.10, t));
    [1047, 1319].forEach((f, i) => this.tone(f, 0.4, 'sine', 0.08, t + 0.15 + i * 0.05));
    // Sparkle on top
    [2093, 2637, 3136].forEach((f, i) => this.tone(f, 0.18, 'sine', 0.04, t + 0.3 + i * 0.05));
  }

  /** Quick whoosh used for screen transitions. */
  playWhoosh(): void { this.noise(0.18, 800, 0.08); }

  /** Magical sparkle used for stars / achievements. */
  playStar(): void {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    [1320, 1760, 2093, 2637].forEach((f, i) => this.tone(f, 0.12, 'sine', 0.08, t + i * 0.04));
  }

  /** Two-note ping for unlock / new item available. */
  playUnlock(): void {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    this.tone(880, 0.12, 'triangle', 0.12, t);
    this.tone(1320, 0.18, 'sine', 0.10, t + 0.08);
  }

  /** Generic dispatcher — convenient for components that don't import the class directly. */
  play(name: EffectName, opt?: { streak?: number }): void {
    switch (name) {
      case 'correct': return this.playCorrect();
      case 'wrong': return this.playWrong();
      case 'combo': return this.playCombo(opt?.streak ?? 3);
      case 'tap': return this.playTap();
      case 'tick': return this.playTimerTick();
      case 'timeUp': return this.playTimeUp();
      case 'hint': return this.playHint();
      case 'sectionComplete': return this.playSectionComplete();
      case 'levelUp': return this.playLevelUp();
      case 'whoosh': return this.playWhoosh();
      case 'star': return this.playStar();
      case 'unlock': return this.playUnlock();
    }
  }
}

export const sounds = new SoundService();
