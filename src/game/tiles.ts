import { Level, Tile } from './types';

export const SP = { star: '⭐', brk: '💥' };
const NORMAL = ['🌸', '🍃', '🔥', '💧', '🌙', '🍒', '🐟', '🔔'];

export interface CampaignStage {
  id: number;
  title: string;
  subtitle: string;
  aiLevel: Level;
  layout: [number, number, number][];
}

// Coordenadas em meias-unidades: cada peça ocupa 2x2. [x, y, camada]
function rows(...specs: [number, number, number, number][]): [number, number, number][] {
  const p: [number, number, number][] = [];
  for (const [y, a, b, z] of specs) for (let x = a; x <= b; x += 2) p.push([x, y, z]);
  return p;
}

const classic = rows([0, 2, 12, 0], [2, 0, 14, 0], [4, 0, 14, 0], [6, 2, 12, 0],
  [2, 4, 10, 1], [4, 4, 10, 1], [3, 6, 8, 2]);

export const CAMPAIGN_STAGES: CampaignStage[] = [
  { id: 1, title: 'Primeiros passos', subtitle: 'Um desenho aberto para aprender a combinar.', aiLevel: 'easy', layout: rows([2, 2, 12, 0], [4, 2, 12, 0], [3, 6, 8, 1]) },
  { id: 2, title: 'Ponte de jade', subtitle: 'Mais peças e uma primeira camada sobre o centro.', aiLevel: 'medium', layout: rows([0, 4, 10, 0], [2, 2, 12, 0], [4, 2, 12, 0], [6, 4, 10, 0], [3, 6, 8, 1]) },
  { id: 3, title: 'Pátio fechado', subtitle: 'A IA passa a priorizar estrelas e bloquear suas opções.', aiLevel: 'medium', layout: rows([0, 4, 10, 0], [2, 0, 14, 0], [4, 0, 14, 0], [6, 4, 10, 0], [2, 4, 10, 1], [4, 4, 10, 1], [3, 6, 8, 2]) },
  { id: 4, title: 'Torre das lanternas', subtitle: 'Camadas sobrepostas reduzem os pares disponíveis.', aiLevel: 'hard', layout: rows([0, 2, 12, 0], [2, 0, 14, 0], [4, 0, 14, 0], [6, 2, 12, 0], [2, 4, 10, 1], [4, 4, 10, 1], [3, 6, 8, 2], [3, 4, 10, 3]) },
  { id: 5, title: 'Jardim suspenso', subtitle: 'A IA antecipa melhor as peças que você poderá liberar.', aiLevel: 'hard', layout: rows([0, 2, 12, 0], [2, 0, 14, 0], [4, 0, 14, 0], [6, 2, 12, 0], [2, 4, 10, 1], [4, 4, 10, 1], [3, 4, 10, 2], [3, 6, 8, 3]) },
  { id: 6, title: 'Pagode antigo', subtitle: 'Quatro níveis de peças e escolhas cada vez mais calculadas.', aiLevel: 'expert', layout: rows([0, 2, 12, 0], [2, 0, 14, 0], [4, 0, 14, 0], [6, 2, 12, 0], [2, 4, 10, 1], [4, 4, 10, 1], [3, 4, 10, 2], [3, 6, 8, 3], [3, 6, 8, 4]) },
  { id: 7, title: 'Dragão de jade', subtitle: 'A IA escolhe pares com leitura estratégica do tabuleiro.', aiLevel: 'expert', layout: rows([0, 2, 12, 0], [2, 0, 14, 0], [4, 0, 14, 0], [6, 2, 12, 0], [2, 4, 10, 1], [4, 4, 10, 1], [3, 4, 10, 2], [3, 4, 10, 3], [3, 6, 8, 4]) },
  { id: 8, title: 'Trono imperial', subtitle: 'Cinco camadas e a IA no auge de sua estratégia.', aiLevel: 'master', layout: rows([0, 2, 12, 0], [2, 0, 14, 0], [4, 0, 14, 0], [6, 2, 12, 0], [2, 4, 10, 1], [4, 4, 10, 1], [3, 4, 10, 2], [3, 4, 10, 3], [3, 6, 8, 4], [5, 8, 10, 2]) },
];

export const BOARD_W = 16, BOARD_H = 8;

const shuffle = <T,>(a: T[]): T[] => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
};

/** Livre = nada por cima e pelo menos um lado (esquerdo/direito) aberto. */
export function isFree(ts: Tile[], t: Tile): boolean {
  if (t.removed) return false;
  let l = false, r = false;
  for (const o of ts) {
    if (o.removed || o.id === t.id) continue;
    const dx = o.x - t.x, dy = Math.abs(o.y - t.y);
    if (o.z === t.z + 1 && Math.abs(dx) < 2 && dy < 2) return false;
    if (o.z === t.z && dy < 2) { if (dx === -2) l = true; if (dx === 2) r = true; }
  }
  return !(l && r);
}

export function freePairs(ts: Tile[]): [number, number][] {
  const f = ts.filter((t) => isFree(ts, t));
  const out: [number, number][] = [];
  for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) if (f[i].sym === f[j].sym) out.push([f[i].id, f[j].id]);
  return out;
}

/** Gera "de trás pra frente": remove pares livres e dá o mesmo símbolo a cada um. Sempre solucionável. */
function assign(ts: Tile[], bag: string[]): Tile[] | null {
  const w = ts.filter((t) => !t.removed).map((t) => ({ ...t }));
  for (const s of shuffle(bag)) {
    const f = w.filter((t) => !t.removed && isFree(w, t));
    if (f.length < 2) return null;
    const [a, b] = shuffle(f);
    a.removed = b.removed = true; a.sym = b.sym = s;
  }
  const m = new Map(w.map((t) => [t.id, t.sym]));
  return ts.map((t) => (t.removed ? t : { ...t, sym: m.get(t.id)! }));
}
const retry = (ts: Tile[], bag: string[]) => { for (let i = 0; i < 300; i++) { const r = assign(ts, bag); if (r) return r; } return ts; };

export function newBoard(stage?: number): Tile[] {
  const coords = stage === undefined ? classic : (CAMPAIGN_STAGES[stage - 1] ?? CAMPAIGN_STAGES[0]).layout;
  const base: Tile[] = coords.map(([x, y, z], id) => ({ id, x, y, z, sym: '', removed: false }));
  const bag = [SP.star, SP.star, SP.star, SP.brk, SP.brk];
  for (let i = 0; bag.length < base.length / 2; i++) bag.push(NORMAL[i % NORMAL.length]);
  return retry(base, bag);
}

export function reshuffle(ts: Tile[]): Tile[] {
  const c: Record<string, number> = {}, bag: string[] = [];
  ts.filter((t) => !t.removed).forEach((t) => (c[t.sym] = (c[t.sym] || 0) + 1));
  for (const s in c) for (let i = 0; i < c[s] / 2; i++) bag.push(s);
  return retry(ts, bag);
}
