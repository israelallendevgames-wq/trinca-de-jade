import { Cell, Config, Player, Tile, opp } from './types';
import { SP, freePairs, isFree, newBoard, reshuffle } from './tiles';
import { winnerOf } from './rules';

export type Pending = 'norm' | 'star' | 'brk';
export interface GameEvent { type: 'match' | 'invalid' | 'mark' | 'erase' | 'win' | 'draw' | 'hint'; ids: number[]; cell?: number; n: number }
export interface State {
  cfg: Config; tiles: Tile[]; sel: number | null; phase: 'pick' | 'place' | 'over'; turn: Player;
  grid: Cell[]; scores: [number, number]; pending: Pending; winner: Player | 'draw' | null;
  line: number[] | null; hint: number[] | null; paused: boolean; ev: GameEvent | null; msg: string | null;
}
export type Action =
  | { t: 'new'; cfg: Config } | { t: 'sel'; id: number } | { t: 'place'; cell: number }
  | { t: 'hint' } | { t: 'pause'; v: boolean };

export const init = (cfg: Config): State => ({
  cfg, tiles: newBoard(cfg.campaignStage), sel: null, phase: 'pick', turn: 0, grid: Array(9).fill(null), scores: [0, 0],
  pending: 'norm', winner: null, line: null, hint: null, paused: false, ev: null, msg: null,
});

const ev = (s: State, type: GameEvent['type'], ids: number[] = [], cell?: number): GameEvent => ({ type, ids, cell, n: (s.ev?.n ?? 0) + 1 });

function ensure(ts: Tile[], stage?: number): [Tile[], string | null] {
  if (ts.every((t) => t.removed)) return [newBoard(stage), 'Novo tabuleiro!'];
  if (freePairs(ts).length) return [ts, null];
  const r = reshuffle(ts);
  if (freePairs(r).length) return [r, 'Sem pares: peças embaralhadas'];
  return [newBoard(stage), 'Novo tabuleiro!'];
}

export function reduce(s: State, a: Action): State {
  switch (a.t) {
    case 'new': return init(a.cfg);
    case 'pause': return { ...s, paused: a.v };
    case 'hint': {
      if (s.paused || s.phase !== 'pick') return s;
      const ps = freePairs(s.tiles);
      const p = ps[Math.floor(Math.random() * ps.length)];
      const scores: [number, number] = [...s.scores];
      if (s.cfg.mode !== 'training') scores[s.turn] = Math.max(0, scores[s.turn] - 5);
      return { ...s, hint: p, scores, sel: null, ev: ev(s, 'hint', p) };
    }
    case 'sel': {
      if (s.paused || s.phase !== 'pick') return s;
      const t = s.tiles[a.id];
      if (!t || t.removed) return s;
      if (!isFree(s.tiles, t)) return { ...s, sel: null, hint: null, ev: ev(s, 'invalid', [a.id]) };
      if (s.sel === null) return { ...s, sel: a.id, hint: null, msg: null };
      if (s.sel === a.id) return { ...s, sel: null };
      const o = s.tiles[s.sel];
      if (o.sym !== t.sym) return { ...s, sel: null, ev: ev(s, 'invalid', [o.id, t.id]) };
      const kind: Pending = t.sym === SP.star ? 'star' : t.sym === SP.brk && s.cfg.mode !== 'training' ? 'brk' : 'norm';
      const scores: [number, number] = [...s.scores];
      scores[s.turn] += kind === 'star' ? 20 : kind === 'brk' ? 15 : 10;
      const [tiles, msg] = ensure(s.tiles.map((x) => (x.id === o.id || x.id === t.id ? { ...x, removed: true } : x)), s.cfg.campaignStage);
      return { ...s, tiles, sel: null, hint: null, phase: 'place', pending: kind, scores, msg, ev: ev(s, 'match', [o.id, t.id]) };
    }
    case 'place': {
      if (s.paused || s.phase !== 'place') return s;
      const c = s.grid[a.cell], me = s.turn, grid = [...s.grid];
      if (c === null) grid[a.cell] = me;
      else if (s.pending === 'brk' && c !== me) grid[a.cell] = null; // 💥 apaga marca do adversário
      else return { ...s, ev: ev(s, 'invalid', [], a.cell) };
      const erase = c !== null;
      const line = erase ? null : winnerOf(grid);
      if (line) {
        const scores: [number, number] = [...s.scores]; scores[me] += 50;
        return { ...s, grid, scores, phase: 'over', winner: me, line, ev: ev(s, 'win', [], a.cell) };
      }
      if (grid.every((x) => x !== null)) return { ...s, grid, phase: 'over', winner: 'draw', ev: ev(s, 'draw') };
      return { ...s, grid, phase: 'pick', pending: 'norm', turn: s.cfg.mode === 'training' ? 0 : opp(me), ev: ev(s, erase ? 'erase' : 'mark', [], a.cell) };
    }
  }
}
