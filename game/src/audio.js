// Tiny synthesized sound effects: no audio files, everything is built
// with WebAudio oscillators so the game stays fully offline.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol || 0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  gobble() {
    // A turkey gobble: a quick run of low wobbling blips.
    if (!this.ctx || this.muted) return;
    for (let i = 0; i < 5; i++) {
      setTimeout(() => this.tone(170 + i * 18, 0.09, 'sawtooth', 0.07, 120), i * 70);
    }
    setTimeout(() => this.tone(320, 0.16, 'square', 0.05, 210), 380);
  }

  jump() { this.tone(280, 0.16, 'sine', 0.10, 560); }
  pickup() { this.tone(660, 0.09, 'triangle', 0.10, 990); setTimeout(() => this.tone(990, 0.12, 'triangle', 0.08, 1320), 70); }
  hit() { this.tone(140, 0.25, 'sawtooth', 0.16, 60); }
  caught() { this.tone(220, 0.5, 'sawtooth', 0.14, 55); setTimeout(() => this.tone(110, 0.7, 'square', 0.10, 50), 200); }
  escaped() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.10), i * 130));
  }
  click() { this.tone(500, 0.05, 'square', 0.05); }
}
