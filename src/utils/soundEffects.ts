class ProceduralSoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = false;

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (val && typeof window !== 'undefined' && !this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (val && this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private playTone(freq: number, durationSec: number, type: OscillatorType = 'sine', gainPeak = 0.045) {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + durationSec + 0.02);
    } catch {
      // Ignore audio context autoplay restrictions
    }
  }

  public playHover() {
    this.playTone(620, 0.055, 'sine', 0.02);
  }

  public playClick() {
    this.playTone(720, 0.065, 'triangle', 0.032);
  }

  public playSelect() {
    this.playTone(523.25, 0.14, 'triangle', 0.045);
    setTimeout(() => this.playTone(783.99, 0.18, 'sine', 0.04), 55);
  }

  public playModeSwitch() {
    this.playTone(440, 0.12, 'sine', 0.035);
    setTimeout(() => this.playTone(659.25, 0.16, 'triangle', 0.035), 45);
  }
}

export const soundEngine = new ProceduralSoundEngine();
