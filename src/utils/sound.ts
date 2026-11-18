class RetroSoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'square', delay = 0, gainVal = 0.06) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  }

  diceRoll() {
    this.playTone(320, 0.05, 'square', 0, 0.04);
    this.playTone(440, 0.05, 'square', 0.06, 0.04);
    this.playTone(580, 0.07, 'square', 0.12, 0.05);
  }

  step() {
    this.playTone(520, 0.04, 'triangle', 0, 0.05);
  }

  badgeWin() {
    this.playTone(523.25, 0.09, 'square', 0, 0.05);
    this.playTone(659.25, 0.09, 'square', 0.09, 0.05);
    this.playTone(783.99, 0.09, 'square', 0.18, 0.05);
    this.playTone(1046.5, 0.22, 'square', 0.27, 0.06);
  }

  battleHit() {
    this.playTone(180, 0.08, 'sawtooth', 0, 0.07);
    this.playTone(110, 0.12, 'sawtooth', 0.07, 0.06);
  }

  battleLose() {
    this.playTone(340, 0.12, 'sawtooth', 0, 0.05);
    this.playTone(260, 0.12, 'sawtooth', 0.13, 0.05);
    this.playTone(190, 0.22, 'sawtooth', 0.26, 0.05);
  }

  eventTrigger() {
    this.playTone(440, 0.08, 'triangle', 0, 0.06);
    this.playTone(660, 0.08, 'triangle', 0.09, 0.06);
    this.playTone(880, 0.14, 'triangle', 0.18, 0.06);
  }

  tradeSuccess() {
    this.playTone(587.33, 0.08, 'square', 0, 0.05);
    this.playTone(880, 0.16, 'square', 0.09, 0.05);
  }
}

export const soundFx = new RetroSoundEngine();
