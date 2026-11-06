/* audio.js — звуки и музыка на Web Audio API (без внешних файлов) */
const Sfx = (() => {
  let ctx = null, muted = false, timer = null, step = 0;
  function ensure() {
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(f, dur, type = 'square', vol = 0.07, slide = 0, delay = 0) {
    const c = ensure(); if (!c || muted) return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.linearRampToValueAtTime(Math.max(30, f + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur);
  }
  const fx = {
    jump: () => tone(300, 0.15, 'square', 0.06, 300),
    coin: () => { tone(988, 0.07); tone(1319, 0.15, 'square', 0.07, 0, 0.07); },
    stomp: () => tone(220, 0.12, 'square', 0.09, -120),
    hurt: () => tone(240, 0.3, 'sawtooth', 0.09, -190),
    select: () => tone(660, 0.05),
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'square', 0.07, 0, i * 0.12)),
    over: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.22, 'triangle', 0.09, 0, i * 0.18))
  };
  const mel = [523,0,659,0,784,0,659,0, 587,0,698,0,880,0,698,0, 523,0,659,0,784,0,1047,0, 988,0,784,0,659,0,587,0];
  const bass = [131, 147, 165, 147, 131, 147, 196, 165];
  return {
    play(n) { if (fx[n]) fx[n](); },
    startMusic() {
      if (timer) return; ensure();
      timer = setInterval(() => {
        const n = mel[step % mel.length]; if (n) tone(n, 0.14, 'triangle', 0.035);
        if (step % 4 === 0) tone(bass[(step >> 2) % bass.length], 0.3, 'square', 0.025);
        step++;
      }, 180);
    },
    stopMusic() { clearInterval(timer); timer = null; },
    toggleMute() { muted = !muted; },
    isMuted: () => muted
  };
})();
