import { useMemo, useState } from 'react';
import { Tile } from '../game/types';
import { BOARD_H, BOARD_W, SP, isFree } from '../game/tiles';

interface Props { tiles: Tile[]; sel: number | null; hint: number[] | null; faceDown?: boolean; revealed?: number[]; onTap: (id: number) => void }
const VH = BOARD_H * 1.3; // altura da peça = 1.3x a largura
type TileArt = { label: string; code: string; family: 'bamboo' | 'dots' | 'honor' | 'special' | 'motif'; count?: number; mark?: string; icon?: string; image?: string; group?: 'animal' | 'nature' | 'gem' };
const TILE_ART: Record<string, TileArt> = {
  '🌸': { label: 'bambu um', code: '一', family: 'bamboo', count: 1, mark: '索' },
  '🍃': { label: 'bambu dois', code: '二', family: 'bamboo', count: 2, mark: '索' },
  '🔥': { label: 'fogo', code: '火', family: 'motif', mark: '火', image: '/tiles/fire.png', group: 'nature' },
  '💧': { label: 'água', code: '水', family: 'motif', mark: '水', image: '/tiles/water.png', group: 'nature' },
  '🌙': { label: 'vento leste', code: '東', family: 'honor', mark: '風' },
  '🍒': { label: 'vento sul', code: '南', family: 'honor', mark: '風' },
  '🐟': { label: 'dragão vermelho', code: '中', family: 'honor', mark: '龍' },
  '🔔': { label: 'dragão verde', code: '發', family: 'honor', mark: '龍' },
  [SP.star]: { label: 'flor de bônus', code: '梅', family: 'special', mark: '花' },
  [SP.brk]: { label: 'dragão de quebra', code: '中', family: 'special', mark: '龍' },
  'beast:lion': { label: 'leão', code: '獅', family: 'motif', mark: '獅子', icon: '獅', image: '/tiles/lion.png', group: 'animal' },
  'beast:dragon': { label: 'dragão', code: '龍', family: 'motif', mark: '龍', icon: '龍', image: '/tiles/dragon.png', group: 'animal' },
  'beast:bear': { label: 'urso', code: '熊', family: 'motif', mark: '熊', icon: '熊', image: '/tiles/bear.png', group: 'animal' },
  'beast:snake': { label: 'cobra', code: '蛇', family: 'motif', mark: '蛇', icon: '蛇', image: '/tiles/snake.png', group: 'animal' },
  'beast:tiger': { label: 'tigre', code: '虎', family: 'motif', mark: '虎', icon: '虎', image: '/tiles/tiger.png', group: 'animal' },
  'beast:scorpion': { label: 'escorpião', code: '蠍', family: 'motif', mark: '蠍', icon: '蠍', image: '/tiles/scorpion.png', group: 'animal' },
  'beast:wolf': { label: 'lobo', code: '狼', family: 'motif', mark: '狼', icon: '狼', image: '/tiles/wolf.png', group: 'animal' },
  'beast:eagle': { label: 'águia', code: '鷲', family: 'motif', mark: '鷲', icon: '鷲', image: '/tiles/eagle.png', group: 'animal' },
  'beast:panther': { label: 'pantera', code: '豹', family: 'motif', mark: '豹', icon: '豹', image: '/tiles/panther.png', group: 'animal' },
  'beast:boar': { label: 'javali', code: '猪', family: 'motif', mark: '猪', icon: '猪', group: 'animal' },
  'beast:kirin': { label: 'kirin', code: '麒麟', family: 'motif', mark: '麒麟', image: '/tiles/kirin.png', group: 'animal' },
  'beast:gorilla': { label: 'gorila', code: '猩', family: 'motif', mark: '猩猩', image: '/tiles/gorilla.png', group: 'animal' },
  'beast:phoenix': { label: 'fênix', code: '鳳', family: 'motif', mark: '鳳凰', image: '/tiles/phoenix.png', group: 'animal' },
  'beast:crocodile': { label: 'crocodilo', code: '鰐', family: 'motif', mark: '鰐', image: '/tiles/crocodile.png', group: 'animal' },
  'beast:rhinoceros': { label: 'rinoceronte', code: '犀', family: 'motif', mark: '犀', image: '/tiles/rhinoceros.png', group: 'animal' },
  'nature:sun': { label: 'sol', code: '日', family: 'motif', mark: '日輪', icon: '陽', group: 'nature' },
  'nature:wind': { label: 'vento', code: '風', family: 'motif', mark: '風', icon: '颯', image: '/tiles/wind.png', group: 'nature' },
  'nature:lightning': { label: 'raio', code: '雷', family: 'motif', mark: '雷', icon: '轟', group: 'nature' },
  'nature:earth': { label: 'terra', code: '土', family: 'motif', mark: '土', icon: '地', image: '/tiles/earth.png', group: 'nature' },
  'nature:wave': { label: 'onda', code: '波', family: 'motif', mark: '波', icon: '潮', group: 'nature' },
  'nature:forest': { label: 'floresta', code: '森', family: 'motif', mark: '森', icon: '樹', group: 'nature' },
  'nature:lotus': { label: 'flor de lótus', code: '蓮', family: 'motif', mark: '蓮', icon: '華', group: 'nature' },
  'nature:metal': { label: 'metal', code: '金', family: 'motif', mark: '金', icon: '鋼', image: '/tiles/metal.png', group: 'nature' },
  'gem:jade': { label: 'jade', code: '翠', family: 'motif', mark: '翡翠', icon: '翠', group: 'gem' },
  'gem:ruby': { label: 'rubi', code: '紅', family: 'motif', mark: '紅玉', icon: '赫', image: '/tiles/ruby.png', group: 'gem' },
  'gem:sapphire': { label: 'safira', code: '蒼', family: 'motif', mark: '青玉', icon: '蒼', image: '/tiles/sapphire.png', group: 'gem' },
  'gem:amethyst': { label: 'ametista', code: '紫', family: 'motif', mark: '紫晶', image: '/tiles/amethyst.png', group: 'gem' },
  'gem:emerald': { label: 'esmeralda', code: '碧', family: 'motif', mark: '翠玉', icon: '碧', image: '/tiles/emerald.png', group: 'gem' },
  'gem:diamond': { label: 'diamante', code: '金', family: 'motif', mark: '金剛', icon: '剛', group: 'gem' },
  'gem:pearl': { label: 'pérola', code: '珠', family: 'motif', mark: '真珠', image: '/tiles/pearl.png', group: 'gem' },
  'gem:topaz': { label: 'topázio', code: '黄', family: 'motif', mark: '黄玉', image: '/tiles/topaz.png', group: 'gem' },
  'gem:quartz': { label: 'quartzo', code: '水', family: 'motif', mark: '水晶', image: '/tiles/quartz.png', group: 'gem' },
  'gem:turquoise': { label: 'turquesa', code: '碧', family: 'motif', mark: '藍玉', image: '/tiles/turquoise.png', group: 'gem' },
  'gem:opal': { label: 'opala', code: '蛋', family: 'motif', mark: '蛋白石', image: '/tiles/opal.png', group: 'gem' },
  'gem:obsidian': { label: 'obsidiana', code: '黒', family: 'motif', mark: '黒曜石', image: '/tiles/obsidian.png', group: 'gem' },
  'gem:citrine': { label: 'citrino', code: '黄', family: 'motif', mark: '黄水晶', image: '/tiles/citrine.png', group: 'gem' },
};

export function TileFace({ sym }: { sym: string }) {
  const art = TILE_ART[sym] ?? { label: sym, code: '?', family: 'honor' as const };
  const special = sym === SP.star ? 'bonus-star' : sym === SP.brk ? 'bonus-break' : '';
  return (
      <span className={`tile-face ${art.family} ${art.group ?? ''} ${special} ${art.mark === '風' ? 'wind' : art.code === '發' ? 'green-dragon' : art.mark === '龍' ? 'red-dragon' : ''}`}>
      {art.image ? <img className="tile-image" src={art.image} alt="" /> : <>
        <span className="tile-code">{art.code}</span>
        {art.family === 'bamboo' && <span className={`tile-art bamboo bamboo-${art.count}`}>{Array.from({ length: art.count ?? 1 }, (_, i) => <i className="bamboo-rod" key={i} />)}</span>}
        {art.family === 'dots' && <span className={`tile-art dots dots-${art.count}`}>{Array.from({ length: art.count ?? 1 }, (_, i) => <i className="pip" key={i} />)}</span>}
        {art.family === 'honor' && <span className="tile-art honor-mark">{art.code}</span>}
        {art.family === 'special' && <span className={`tile-art special-mark ${sym === SP.brk ? 'break-mark' : ''}`}>{sym === SP.star ? '✿' : '中'}</span>}
        {art.family === 'motif' && <span className="tile-art motif-mark" aria-hidden="true">{art.icon}</span>}
        <span className="tile-caption">{art.mark}</span>
      </>}
    </span>
  );
}

export default function MahjongBoard({ tiles, sel, hint, faceDown = false, revealed = [], onTap }: Props) {
  const free = useMemo(() => new Set(tiles.filter((t) => isFree(tiles, t)).map((t) => t.id)), [tiles]);
  const [previewId, setPreviewId] = useState<number | null>(null);
  return (
    <div className="mj" style={{ aspectRatio: `${BOARD_W} / ${VH}` }}>
      {tiles.map((t) => {
        const art = TILE_ART[t.sym] ?? { label: t.sym, code: '?', family: 'honor' as const };
        const hidden = faceDown && t.z > 0 && !revealed.includes(t.id);
        const previewed = previewId === t.id;
        const cls = ['tile', t.removed ? 'gone' : free.has(t.id) ? 'free' : 'blocked', sel === t.id ? 'sel' : '', hint?.includes(t.id) ? 'hint' : '', previewed ? 'preview' : '',
          hidden ? '' : t.sym === SP.star ? 'star' : t.sym === SP.brk ? 'brk' : ''].join(' ');
        return (
          <button key={t.id} data-tile={t.id} className={cls} tabIndex={t.removed ? -1 : 0} aria-label={hidden ? 'Peça de mahjong virada para baixo' : `Peça de mahjong: ${art.label}`}
            style={{ left: `calc(${(t.x / BOARD_W) * 100}% - ${t.z * 3}px)`, top: `calc(${((t.y * 1.3) / VH) * 100}% - ${t.z * 4}px)`,
              width: `${(2 / BOARD_W) * 100}%`, height: `${((2 * 1.3) / VH) * 100}%`, zIndex: previewed ? 1000 : t.z * 10 + t.y }}
            onPointerEnter={(event) => { if (event.pointerType === 'mouse') setPreviewId(t.id); }}
            onPointerLeave={(event) => { if (event.pointerType === 'mouse' || previewed) setPreviewId(null); }}
            onPointerDown={(event) => { if (event.pointerType !== 'mouse') setPreviewId(t.id); }}
            onPointerUp={(event) => { if (event.pointerType !== 'mouse') setPreviewId(null); }}
            onPointerCancel={() => setPreviewId(null)}
            onFocus={(event) => { if (event.currentTarget.matches(':focus-visible')) setPreviewId(t.id); }}
            onBlur={() => setPreviewId(null)}
            onClick={() => !t.removed && onTap(t.id)}>
            {hidden ? <span className="tile-back" aria-hidden="true" /> : <TileFace sym={t.sym} />}
          </button>
        );
      })}
    </div>
  );
}
