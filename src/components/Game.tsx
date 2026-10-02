import { ReactNode, useEffect, useReducer, useState } from 'react';
import { Config, Level, Player } from '../game/types';
import { init, reduce } from '../game/state';
import { aiCell, aiPair } from '../game/ai';
import { isFree } from '../game/tiles';
import { CAMPAIGN_STAGES } from '../game/tiles';
import { burst, centerOf, sfx, shake } from '../game/fx';
import MahjongBoard from './MahjongBoard';
import TicTacToe from './TicTacToe';

interface Props { cfg: Config; wins: { p1: number; p2: number; draws: number }; onResult: (w: Player | 'draw') => void; onExit: () => void; onNext: () => void }
const LV: Record<Level, string> = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil', expert: 'Especialista', master: 'Mestre' };
const COL = ['#ff7a59', '#4fe0c8'];

function Modal({ title, children }: { title: string; children: ReactNode }) {
  return <div className="overlay"><div className="modal"><h2>{title}</h2>{children}</div></div>;
}

export default function Game({ cfg, wins, onResult, onExit, onNext }: Props) {
  const [s, d] = useReducer(reduce, cfg, init);
  const [showEnd, setShowEnd] = useState(false);
  const training = cfg.mode === 'training';
  const campaignStage = cfg.campaignStage ? CAMPAIGN_STAGES[cfg.campaignStage - 1] : undefined;
  const names = cfg.mode === 'ai' ? ['Você', `IA ${LV[cfg.level]}`] : training ? ['Treino', ''] : ['Jogador 1', 'Jogador 2'];
  const isAI = cfg.mode === 'ai' && s.turn === 1 && s.phase !== 'over';

  // IA: escolhe par (2 toques) e depois a casa. O reducer valida tudo, igual para humanos.
  useEffect(() => {
    if (!isAI || s.paused) return;
    let id: number;
    if (s.phase === 'pick' && s.sel === null) id = window.setTimeout(() => d({ t: 'sel', id: aiPair(s.tiles, cfg.level, cfg.campaignStage ?? 0)[0] }), 900);
    else if (s.phase === 'pick') id = window.setTimeout(() => {
      const a = s.tiles[s.sel!];
      const b = s.tiles.find((t) => t.id !== a.id && t.sym === a.sym && isFree(s.tiles, t));
      d({ t: 'sel', id: b ? b.id : a.id });
    }, 500);
    else id = window.setTimeout(() => d({ t: 'place', cell: aiCell(s.grid, 1, cfg.level) }), 850);
    return () => clearTimeout(id);
  }, [isAI, s.phase, s.sel, s.turn, s.paused, s.tiles, s.grid, cfg.level, cfg.campaignStage]);

  useEffect(() => { if (s.sel !== null) sfx('select'); }, [s.sel]);

  // Efeitos visuais e sonoros reagem aos eventos do reducer.
  useEffect(() => {
    const e = s.ev; if (!e) return;
    if (e.type === 'match') { sfx('match'); e.ids.forEach((i) => { const c = centerOf(`[data-tile="${i}"]`); if (c) burst(c[0], c[1], '#f2c14e'); }); }
    if (e.type === 'invalid') { sfx('invalid'); e.ids.forEach((i) => shake(document.querySelector(`[data-tile="${i}"]`))); if (e.cell !== undefined) shake(document.querySelector(`[data-cell="${e.cell}"]`)); }
    if (e.type === 'mark' || e.type === 'erase') { sfx(e.type === 'mark' ? 'place' : 'erase'); const c = centerOf(`[data-cell="${e.cell}"]`); if (c) burst(c[0], c[1], COL[s.turn === 0 ? 1 : 0], 10); }
    if (e.type === 'draw') sfx('draw');
    if (e.type === 'win') {
      sfx('win');
      s.line?.forEach((i) => { const c = centerOf(`[data-cell="${i}"]`); if (c) burst(c[0], c[1], COL[s.winner as number], 28); });
    }
  }, [s.ev]);

  useEffect(() => {
    if (s.phase !== 'over') { setShowEnd(false); return; }
    onResult(s.winner as Player | 'draw');
    const id = window.setTimeout(() => setShowEnd(true), 1200);
    return () => clearTimeout(id);
  }, [s.phase]);

  const human = !isAI && !s.paused;
  const status =
    s.phase === 'over' ? 'Fim de jogo' :
    s.phase === 'pick' ? (isAI ? 'A IA está escolhendo um par…' : `${names[s.turn]}: toque em duas peças iguais e livres`) :
    s.pending === 'brk' ? `💥 Quebra! ${isAI ? 'A IA joga…' : 'Marque uma casa vazia ou apague uma marca rival'}` :
    s.pending === 'star' ? `⭐ Bônus! ${isAI ? 'A IA joga…' : 'Escolha uma casa'}` : isAI ? 'A IA está escolhendo a casa…' : 'Par feito! Escolha uma casa do 3x3';

  const result = s.winner === 'draw' ? 'Empate!' : s.winner === null ? '' : cfg.mode === 'ai' ? (s.winner === 0 ? 'Você venceu! 🎉' : 'A IA venceu') : `${names[s.winner]} venceu! 🎉`;

  return (
    <div className="game">
      <header className="bar">
        <button className="ic" onClick={() => d({ t: 'pause', v: true })} aria-label="Pausar">⏸</button>
        <strong>{campaignStage ? `Fase ${campaignStage.id}/${CAMPAIGN_STAGES.length} · ${campaignStage.title}` : training ? 'Modo treino' : cfg.mode === 'ai' ? 'Contra a IA' : 'Dois jogadores'}</strong>
        <button className="ic" onClick={() => d({ t: 'new', cfg })} aria-label="Reiniciar partida">↻</button>
      </header>
      <section className="players">
        {([0, 1] as Player[]).filter((i) => !(training && i === 1)).map((i) => (
          <div key={i} className={`chip p${i} ${s.turn === i && s.phase !== 'over' ? 'active' : ''}`}>
            <b>{i === 0 ? '✕' : '○'} {names[i]}</b>
            <span className="pts">{s.scores[i]} pts</span>
            <small>{i === 0 ? wins.p1 : wins.p2} vitórias</small>
          </div>
        ))}
      </section>
      <p className="status" role="status">{s.msg ? `${s.msg} · ` : ''}{status}</p>
      <div className="stage">
        <MahjongBoard tiles={s.tiles} sel={s.sel} hint={s.hint} onTap={(id) => human && d({ t: 'sel', id })} />
        <TicTacToe grid={s.grid} line={s.line} placing={s.phase === 'place' && human} canErase={s.pending === 'brk'} turn={s.turn}
          onPick={(cell) => human && d({ t: 'place', cell })} />
      </div>
      <footer className="foot">
        <button className="btn ghost" disabled={!human || s.phase !== 'pick'} onClick={() => d({ t: 'hint' })}>💡 Dica{training ? '' : ' (−5)'}</button>
      </footer>

      {s.paused && (
        <Modal title="Pausado">
          <button className="btn" onClick={() => d({ t: 'pause', v: false })}>Continuar</button>
          <button className="btn ghost" onClick={() => d({ t: 'new', cfg })}>Reiniciar</button>
          <button className="btn ghost" onClick={onExit}>{campaignStage ? 'Mapa da campanha' : 'Menu principal'}</button>
        </Modal>
      )}
      {showEnd && (
        <Modal title={result}>
          <p className="final">{training ? `Pontuação: ${s.scores[0]}` : `${names[0]} ${s.scores[0]} × ${s.scores[1]} ${names[1]}`}</p>
          {campaignStage && s.winner === 0 && campaignStage.id < CAMPAIGN_STAGES.length && <button className="btn" onClick={onNext}>Próxima fase →</button>}
          <button className="btn" onClick={() => d({ t: 'new', cfg })}>Jogar novamente</button>
          <button className="btn ghost" onClick={onExit}>{campaignStage ? 'Mapa da campanha' : 'Menu principal'}</button>
        </Modal>
      )}
    </div>
  );
}
