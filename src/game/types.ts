export type Mode = 'ai' | 'pvp' | 'training' | 'solo';
export type Level = 'easy' | 'medium' | 'hard' | 'expert' | 'master';
export type Player = 0 | 1;
export type Cell = Player | null;
export interface Tile { id: number; x: number; y: number; z: number; sym: string; removed: boolean }
export interface Config { mode: Mode; level: Level; aiDifficulty?: number; difficulty?: number; campaignStage?: number; boardLayout?: [number, number, number][]; faceDown?: boolean }
export const opp = (p: Player): Player => (p === 0 ? 1 : 0);
