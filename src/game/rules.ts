import { Cell } from './types';
export const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
export function winnerOf(g: Cell[]): number[] | null {
  for (const l of LINES) if (g[l[0]] !== null && g[l[0]] === g[l[1]] && g[l[1]] === g[l[2]]) return l;
  return null;
}
