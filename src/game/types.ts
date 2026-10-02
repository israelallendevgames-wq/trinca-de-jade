export type Mode = 'ai' | 'pvp' | 'training';
export type Level = 'easy' | 'medium' | 'hard' | 'expert' | 'master';
export type Player = 0 | 1;
export type Cell = Player | null;
export interface Tile { id: number; x: number; y: number; z: number; sym: string; removed: boolean }
export interface Config { mode: Mode; level: Level; campaignStage?: number }
export const opp = (p: Player): Player => (p === 0 ? 1 : 0);
