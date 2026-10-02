import { Cell, Player } from '../game/types';

interface Props { grid: Cell[]; line: number[] | null; placing: boolean; canErase: boolean; turn: Player; onPick: (i: number) => void }
export default function TicTacToe({ grid, line, placing, canErase, turn, onPick }: Props) {
  return (
    <div className="ttt" role="grid" aria-label="Jogo da velha">
      {grid.map((c, i) => {
        const cls = ['cell', c === null ? '' : 'p' + c, placing && c === null ? 'open' : '', placing && canErase && c !== null && c !== turn ? 'erase' : '', line?.includes(i) ? 'win' : ''].join(' ');
        return (
          <button key={i} data-cell={i} className={cls} onClick={() => onPick(i)} aria-label={`Casa ${i + 1}`}>
            {c !== null && <span className="mk">{c === 0 ? '✕' : '○'}</span>}
          </button>
        );
      })}
    </div>
  );
}
