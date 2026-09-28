// UI sounds synthesized with WebAudio: no audio files, in the spirit of claude-sfx.
// Off by default; the speaker in the tray turns them on and the choice is remembered.

const KEY = 'cuperos.sound';
let ctx: AudioContext | null = null;
let enabled = false;

try { enabled = localStorage.getItem(KEY) === 'on'; } catch { /* default off */ }

function audio(): AudioContext | null {
  if (!enabled) return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, { type = 'square' as OscillatorType, gain = 0.05, at = 0, slideTo = 0 } = {}) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + at;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  click: () => tone(1800, 0.018, { gain: 0.025 }),
  open: () => { tone(520, 0.05, { gain: 0.03 }); tone(780, 0.07, { gain: 0.03, at: 0.045 }); },
  close: () => { tone(700, 0.05, { gain: 0.03 }); tone(470, 0.07, { gain: 0.03, at: 0.045 }); },
  minimize: () => tone(900, 0.09, { type: 'triangle', gain: 0.05, slideTo: 300 }),
  /** Bell: A5 fundamental plus an inharmonic 4.2x partial, which is what makes it a bell. */
  ding: () => { tone(880, 0.6, { type: 'sine', gain: 0.08 }); tone(880 * 4.2, 0.25, { type: 'sine', gain: 0.02 }); },
  /** Descending sawtooth, the claude-sfx error sound in miniature. */
  error: () => tone(520, 0.28, { type: 'sawtooth', gain: 0.035, slideTo: 140 }),
  chime: () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.9 - i * 0.12, { type: 'sine', gain: 0.05, at: i * 0.11 }));
    tone(261.63, 1.1, { type: 'triangle', gain: 0.03 });
  },
  key: () => tone(2400 + Math.random() * 400, 0.01, { gain: 0.012 }),
};

export function soundEnabled() { return enabled; }

export function setSound(on: boolean) {
  enabled = on;
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* ignore */ }
  if (on) sfx.chime();
}
