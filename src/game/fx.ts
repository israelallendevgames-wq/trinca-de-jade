// Sons (WebAudio, sem arquivos) e partículas (Web Animations API).
let ctx: AudioContext | null = null, on = true;
export const setSound = (v: boolean) => { on = v; };
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function tone(f: number, at: number, type: OscillatorType = 'sine', d = 0.14, v = 0.07) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + at;
  o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + d);
}
function clack(at: number, volume: number, frequency: number) {
  if (!ctx) return;
  const duration = 0.055, length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate), samples = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.006));
  const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain(), start = ctx.currentTime + at;
  filter.type = 'bandpass'; filter.frequency.value = frequency; filter.Q.value = 1.2;
  gain.gain.setValueAtTime(volume, start); gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.buffer = buffer; source.connect(filter); filter.connect(gain); gain.connect(ctx.destination); source.start(start); source.stop(start + duration);
}
type Note = [number, number, OscillatorType?];
const SEQ: Record<string, Note[]> = {
  select: [[660, 0]], match: [[523, 0], [784, 0.08]], place: [[392, 0, 'triangle'], [588, 0.07, 'triangle']],
  invalid: [[160, 0, 'sawtooth'], [130, 0.09, 'sawtooth']], erase: [[500, 0], [300, 0.1]],
  win: [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36]], draw: [[400, 0], [400, 0.15]],
};
export function sfx(name: string) {
  if (!on || (!SEQ[name] && name !== 'domino')) return;
  try {
    ctx = ctx ?? new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    if (name === 'domino') { clack(0, 0.2, 760); clack(0.045, 0.14, 1080); return; }
    SEQ[name].forEach(([f, at, ty]) => tone(f, at, ty ?? 'sine'));
  } catch { /* sem áudio */ }
}

export function burst(x: number, y: number, color: string, n = 14) {
  if (reduced()) return;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i'), a = Math.random() * 6.28, d = 30 + Math.random() * 60;
    Object.assign(p.style, { position: 'fixed', left: x + 'px', top: y + 'px', width: '8px', height: '8px', borderRadius: '50%', background: color, pointerEvents: 'none', zIndex: '99' });
    document.body.appendChild(p);
    const an = p.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(0)`, opacity: 0 }], { duration: 600 + Math.random() * 300, easing: 'ease-out' });
    an.onfinish = () => p.remove();
  }
}
export function shake(el: Element | null) {
  if (!el || reduced()) return;
  el.animate([{ translate: '0' }, { translate: '-5px' }, { translate: '5px' }, { translate: '-3px' }, { translate: '0' }], { duration: 300 });
}
export const centerOf = (sel: string): [number, number] | null => {
  const el = document.querySelector(sel); if (!el) return null;
  const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2];
};
