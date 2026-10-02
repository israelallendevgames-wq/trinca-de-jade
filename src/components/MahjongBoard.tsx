import { useMemo } from 'react';
import { Tile } from '../game/types';
import { BOARD_H, BOARD_W, SP, isFree } from '../game/tiles';

interface Props { tiles: Tile[]; sel: number | null; hint: number[] | null; onTap: (id: number) => void }
const VH = BOARD_H * 1.3; // altura da peça = 1.3x a largura
type TileArt = { label: string; code: string; family: 'bamboo' | 'dots' | 'honor' | 'special'; count?: number; mark?: string };
const TILE_ART: Record<string, TileArt> = {
  '🌸': { label: 'bambu um', code: '一', family: 'bamboo', count: 1, mark: '索' },
  '🍃': { label: 'bambu dois', code: '二', family: 'bamboo', count: 2, mark: '索' },
  '🔥': { label: 'bambu três', code: '三', family: 'bamboo', count: 3, mark: '索' },
  '💧': { label: 'círculos quatro', code: '四', family: 'dots', count: 4, mark: '筒' },
  '🌙': { label: 'vento leste', code: '東', family: 'honor', mark: '風' },
  '🍒': { label: 'vento sul', code: '南', family: 'honor', mark: '風' },
  '🐟': { label: 'dragão vermelho', code: '中', family: 'honor', mark: '龍' },
  '🔔': { label: 'dragão verde', code: '發', family: 'honor', mark: '龍' },
  [SP.star]: { label: 'flor de bônus', code: '梅', family: 'special', mark: '花' },
  [SP.brk]: { label: 'dragão de quebra', code: '中', family: 'special', mark: '龍' },
};

export default function MahjongBoard({ tiles, sel, hint, onTap }: Props) {
  const free = useMemo(() => new Set(tiles.filter((t) => isFree(tiles, t)).map((t) => t.id)), [tiles]);
  return (
    <div className="mj" style={{ aspectRatio: `${BOARD_W} / ${VH}` }}>
      {tiles.map((t) => {
        const art = TILE_ART[t.sym] ?? { label: t.sym, code: '?', family: 'honor' as const };
        const cls = ['tile', t.removed ? 'gone' : free.has(t.id) ? 'free' : 'blocked', sel === t.id ? 'sel' : '', hint?.includes(t.id) ? 'hint' : '',
          t.sym === SP.star ? 'star' : t.sym === SP.brk ? 'brk' : ''].join(' ');
        return (
          <button key={t.id} data-tile={t.id} className={cls} tabIndex={t.removed ? -1 : 0} aria-label={`Peça de mahjong: ${art.label}`}
            style={{ left: `calc(${(t.x / BOARD_W) * 100}% - ${t.z * 3}px)`, top: `calc(${((t.y * 1.3) / VH) * 100}% - ${t.z * 4}px)`,
              width: `${(2 / BOARD_W) * 100}%`, height: `${((2 * 1.3) / VH) * 100}%`, zIndex: t.z * 10 + t.y }}
            onClick={() => !t.removed && onTap(t.id)}>
            <span className={`tile-face ${art.family} ${art.mark === '風' ? 'wind' : art.code === '發' ? 'green-dragon' : art.mark === '龍' ? 'red-dragon' : ''}`}>
              <span className="tile-code">{art.code}</span>
              {art.family === 'bamboo' && <span className={`tile-art bamboo bamboo-${art.count}`}>{Array.from({ length: art.count ?? 1 }, (_, i) => <i className="bamboo-rod" key={i} />)}</span>}
              {art.family === 'dots' && <span className={`tile-art dots dots-${art.count}`}>{Array.from({ length: art.count ?? 1 }, (_, i) => <i className="pip" key={i} />)}</span>}
              {art.family === 'honor' && <span className="tile-art honor-mark">{art.code}</span>}
              {art.family === 'special' && <span className={`tile-art special-mark ${t.sym === SP.brk ? 'break-mark' : ''}`}>{t.sym === SP.star ? '✿' : '中'}</span>}
              <span className="tile-caption">{art.mark}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
