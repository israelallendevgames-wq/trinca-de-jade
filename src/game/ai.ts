import { Cell, Level, Player, Tile, opp } from './types';
import { SP, freePairs } from './tiles';
import { winnerOf } from './rules';

const rnd = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const empty = (g: Cell[]) => g.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);

/** Escolha do par: fácil = aleatório; médio = gosta de ⭐; difícil = pesa o que libera para o rival. */
export function aiPair(ts: Tile[], lv: Level, power = 0): [number, number] {
  const ps = freePairs(ts);
  if (lv === 'easy' && power < 2) return rnd(ps);
  const star = ps.filter((p) => ts[p[0]].sym === SP.star);
  if (lv === 'medium' && power < 3) return star.length && Math.random() < 0.6 ? rnd(star) : rnd(ps);
  let best = ps[0], bs = -99;
  for (const p of ps) {
    const after = ts.map((t) => (p.includes(t.id) ? { ...t, removed: true } : t));
    const gift = freePairs(after).filter((q) => after[q[0]].sym === SP.star).length; // ⭐ que o rival ganharia
    const mobility = freePairs(after).length;
    const sym = ts[p[0]].sym;
    const precision = Math.min(8, Math.max(power, lv === 'master' ? 8 : lv === 'expert' ? 6 : lv === 'hard' ? 4 : 0));
    const noise = precision >= 6 ? 0 : Math.max(0.03, 0.3 - precision * 0.04);
    const s = (sym === SP.star ? 3 : 0) - (sym === SP.brk ? 1 : 0) - gift * (1.2 + precision * 0.18)
      - mobility * (precision * 0.08) + Math.random() * noise;
    if (s > bs) { bs = s; best = p; }
  }
  return best;
}

const findWin = (g: Cell[], p: Player) => empty(g).find((i) => { const h = [...g]; h[i] = p; return !!winnerOf(h); });

function minimax(g: Cell[], turn: Player, me: Player): number {
  const w = winnerOf(g);
  if (w) return g[w[0]] === me ? 1 : -1;
  const e = empty(g);
  if (!e.length) return 0;
  const sc = e.map((i) => { const h = [...g]; h[i] = turn; return minimax(h, opp(turn), me); });
  return turn === me ? Math.max(...sc) : Math.min(...sc);
}

export function aiCell(g: Cell[], me: Player, lv: Level): number {
  const e = empty(g);
  if (lv === 'easy') return rnd(e);
  const w = findWin(g, me); if (w !== undefined) return w;
  const b = findWin(g, opp(me)); if (b !== undefined) return b;
  if (lv === 'medium') return g[4] === null && Math.random() < 0.5 ? 4 : rnd(e);
  let best = e[0], bs = -2;
  for (const i of e) {
    const h = [...g]; h[i] = me;
    const s = minimax(h, opp(me), me);
    if (s > bs || (s === bs && Math.random() < 0.4)) { bs = s; best = i; }
  }
  return best;
}
