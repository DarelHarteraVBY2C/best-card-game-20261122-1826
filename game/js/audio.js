// Emberwind Duel — tiny sound kit, built from the Web Audio API only.
// No audio files are loaded: every effect is a short oscillator phrase
// synthesized on the spot. Sounds stay silent until the player first
// interacts, because browsers block audio before a gesture.

let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playCardSound() {
  tone(520, 0.09, 'triangle', 0.16);
  tone(780, 0.12, 'triangle', 0.12, 0.05);
}

export function strikeSound() {
  tone(220, 0.18, 'sawtooth', 0.2, 0, 90);
  tone(110, 0.22, 'square', 0.12, 0.02, 55);
}

export function healSound() {
  tone(440, 0.16, 'sine', 0.14, 0, 660);
  tone(660, 0.22, 'sine', 0.12, 0.1, 880);
}

export function guardSound() {
  tone(330, 0.12, 'square', 0.1);
  tone(247, 0.16, 'square', 0.1, 0.07);
}

export function drawSound() {
  tone(600, 0.07, 'triangle', 0.1);
  tone(900, 0.09, 'triangle', 0.1, 0.06);
}

export function comboSound() {
  tone(523, 0.1, 'triangle', 0.14);
  tone(659, 0.1, 'triangle', 0.14, 0.08);
  tone(784, 0.18, 'triangle', 0.16, 0.16);
}

export function turnSound() {
  tone(392, 0.1, 'sine', 0.12);
}

export function winFanfare() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, 'triangle', 0.16, i * 0.13));
}

export function lossSound() {
  [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'sine', 0.13, i * 0.16));
}
