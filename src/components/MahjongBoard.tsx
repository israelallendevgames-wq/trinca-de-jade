import { useMemo } from 'react';
import { Tile } from '../game/types';
import { BOARD_H, BOARD_W, SP, isFree } from '../game/tiles';

interface Props { tiles: Tile[]; sel: number | null; hint: number[] | null; onTap: (id: number) => void }
const VH = BOARD_H * 1.3; // altura da peça = 1.3x a largura

export default function MahjongBoard({ tiles, sel, hint, onTap }: Props) {
  const free = useMemo(() => new Set(tiles.filter((t) => isFree(tiles, t)).map((t) => t.id)), [tiles]);
  return (
    <div className="mj" style={{ aspectRatio: `${BOARD_W} / ${VH}` }}>
      {tiles.map((t) => {
        const cls = ['tile', t.removed ? 'gone' : free.has(t.id) ? 'free' : 'blocked', sel === t.id ? 'sel' : '', hint?.includes(t.id) ? 'hint' : '',
          t.sym === SP.star ? 'star' : t.sym === SP.brk ? 'brk' : ''].join(' ');
        return (
          <button key={t.id} data-tile={t.id} className={cls} tabIndex={t.removed ? -1 : 0} aria-label={`Peça ${t.sym}`}
            style={{ left: `calc(${(t.x / BOARD_W) * 100}% - ${t.z * 3}px)`, top: `calc(${((t.y * 1.3) / VH) * 100}% - ${t.z * 4}px)`,
              width: `${(2 / BOARD_W) * 100}%`, height: `${((2 * 1.3) / VH) * 100}%`, zIndex: t.z * 10 + t.y }}
            onClick={() => !t.removed && onTap(t.id)}>
            <span>{t.sym}</span>
          </button>
        );
      })}
    </div>
  );
}
