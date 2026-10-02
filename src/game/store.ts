import { Level, Mode } from './types';
export interface Settings { sound: boolean; level: Level }
export type Stats = Record<Mode, { p1: number; p2: number; draws: number }>;
export const defaultStats = (): Stats => ({ ai: { p1: 0, p2: 0, draws: 0 }, pvp: { p1: 0, p2: 0, draws: 0 }, training: { p1: 0, p2: 0, draws: 0 } });
export function load<T extends object>(k: string, d: T): T { try { const v = localStorage.getItem('tj:' + k); return v ? { ...d, ...JSON.parse(v) } : d; } catch { return d; } }
export function save(k: string, v: unknown) { try { localStorage.setItem('tj:' + k, JSON.stringify(v)); } catch { /* ignore */ } }
