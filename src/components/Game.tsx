import { ReactNode, useEffect, useReducer, useState } from 'react';
import { Config, Level, Player } from '../game/types';
import { init, reduce } from '../game/state';
import { aiCell, aiPair } from '../game/ai';
import { isFree } from '../game/tiles';
import { CAMPAIGN_STAGES } from '../game/tiles';
import { burst, centerOf, sfx, shake } from '../game/fx';
import MahjongBoard, { TileFace } from './MahjongBoard';
import TicTacToe from './TicTacToe';

interface Props { cfg: Config; wins: { p1: number; p2: number; draws: number }; soundEnabled: boolean; musicOn: boolean; toggleMusic: () => void; onGamePaused: (paused: boolean) => void; onResult: (w: Player | 'draw') => void; onSoloResult: (completed: boolean, stage?: number) => void; onExit: () => void; onNext: () => void }
const LV: Record<Level, string> = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil', expert: 'Especialista', master: 'Mestre' };
const COL = ['#ff7a59', '#4fe0c8'];
const moveSeconds = (difficulty = 0) => Math.max(15, 60 - Math.round(difficulty * 0.45));

function flyTile(source: HTMLElement, target: HTMLElement, impact = false) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const from = source.getBoundingClientRect(), to = target.getBoundingClientRect();
  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute('data-tile'); clone.removeAttribute('data-rack-slot');
  Object.assign(clone.style, {
    position: 'fixed', left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`,
    margin: '0', zIndex: '9999', pointerEvents: 'none', transform: 'none', transition: 'none', opacity: '1',
  });
  document.body.appendChild(clone);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const scale = Math.min(to.width / from.width, to.height / from.height);
  const animation = clone.animate(impact ? [
    { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0 },
    { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 1, offset: 0.78 },
    { transform: `translate(${dx - 5}px, ${dy}px) scale(${scale * 1.08}) rotate(-6deg)`, opacity: 1, offset: 0.87 },
    { transform: `translate(${dx}px, ${dy}px) scale(${scale * 0.72})`, opacity: 0, offset: 1 },
  ] : [
    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
    { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 1 },
  ], { duration: impact ? 440 : 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' });
  animation.onfinish = () => clone.remove();
  window.setTimeout(() => clone.remove(), 520);
}

function Modal({ title, children }: { title: string; children: ReactNode }) {
  return <div className="overlay"><div className="modal"><h2>{title}</h2>{children}</div></div>;
}

export default function Game({ cfg, wins, soundEnabled, musicOn, toggleMusic, onGamePaused, onResult, onSoloResult, onExit, onNext }: Props) {
  const [s, d] = useReducer(reduce, cfg, init);
  const [showEnd, setShowEnd] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => moveSeconds(cfg.difficulty));
  const training = cfg.mode === 'training';
  const solo = cfg.mode === 'solo';
  const campaignStage = cfg.campaignStage ? CAMPAIGN_STAGES[cfg.campaignStage - 1] : undefined;
  const names = cfg.mode === 'ai' ? ['Você', cfg.aiDifficulty === undefined ? `IA ${LV[cfg.level]}` : `IA nível ${cfg.aiDifficulty}`] : training ? ['Treino', ''] : ['Jogador 1', 'Jogador 2'];
  const isAI = cfg.mode === 'ai' && s.turn === 1 && s.phase !== 'over' && s.phase !== 'penalty';

  useEffect(() => {
    onGamePaused(s.paused);
    return () => onGamePaused(false);
  }, [s.paused, onGamePaused]);

  // IA: escolhe par (2 toques) e depois a casa. O reducer valida tudo, igual para humanos.
  useEffect(() => {
    if (!isAI || s.paused) return;
    let id: number;
    if (s.phase === 'pick' && s.sel === null) id = window.setTimeout(() => d({ t: 'sel', id: aiPair(s.tiles, cfg.level, cfg.campaignStage ?? 0, cfg.aiDifficulty)[0] }), 900);
    else if (s.phase === 'pick') id = window.setTimeout(() => {
      const a = s.tiles[s.sel!];
      const b = s.tiles.find((t) => t.id !== a.id && t.sym === a.sym && isFree(s.tiles, t));
      d({ t: 'sel', id: b ? b.id : a.id });
    }, 500);
    else id = window.setTimeout(() => d({ t: 'place', cell: aiCell(s.grid, 1, cfg.level, cfg.aiDifficulty) }), 850);
    return () => clearTimeout(id);
  }, [isAI, s.phase, s.sel, s.turn, s.paused, s.tiles, s.grid, cfg.level, cfg.aiDifficulty, cfg.campaignStage]);

  useEffect(() => {
    if (s.phase !== 'penalty' || s.paused) return;
    const id = window.setTimeout(() => d({ t: 'miss' }), 900);
    return () => clearTimeout(id);
  }, [s.phase, s.paused]);

  useEffect(() => {
    if (!solo || s.phase !== 'pick' || s.paused) return;
    const id = window.setInterval(() => setTimeLeft((time) => Math.max(0, time - 1)), 1000);
    return () => clearInterval(id);
  }, [solo, s.phase, s.paused, s.tiles]);

  useEffect(() => { if (solo) setTimeLeft(moveSeconds(cfg.difficulty)); }, [solo, cfg.difficulty, s.tiles]);

  useEffect(() => {
    if (solo && s.phase === 'pick' && !s.paused && timeLeft === 0) d({ t: 'timeout' });
  }, [solo, s.phase, s.paused, timeLeft]);

  useEffect(() => { if (s.sel !== null) sfx('select'); }, [s.sel]);

  // Efeitos visuais e sonoros reagem aos eventos do reducer.
  useEffect(() => {
    const e = s.ev; if (!e) return;
    if (e.type === 'match') { sfx('match'); e.ids.forEach((i) => { const c = centerOf(`[data-tile="${i}"]`); if (c) burst(c[0], c[1], '#f2c14e'); }); }
        if (e.type === 'match') {
          sfx(solo ? 'domino' : 'match');
          if (solo && e.cell !== undefined) { const c = centerOf(`[data-rack-slot="${e.cell}"]`); if (c) burst(c[0], c[1], '#f2c14e', 10); }
          else e.ids.forEach((i) => { const c = centerOf(`[data-tile="${i}"]`); if (c) burst(c[0], c[1], '#f2c14e'); });
        }

    function flyTile(source: HTMLElement, target: HTMLElement, impact = false) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const from = source.getBoundingClientRect(), to = target.getBoundingClientRect();
      const clone = source.cloneNode(true) as HTMLElement;
      clone.removeAttribute('data-tile'); clone.removeAttribute('data-rack-slot');
      Object.assign(clone.style, {
        position: 'fixed', left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`,
        margin: '0', zIndex: '9999', pointerEvents: 'none', transform: 'none', transition: 'none', opacity: '1',
      });
      document.body.appendChild(clone);
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      const scale = Math.min(to.width / from.width, to.height / from.height);
      const animation = clone.animate(impact ? [
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0 },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 1, offset: 0.78 },
        { transform: `translate(${dx - 5}px, ${dy}px) scale(${scale * 1.08}) rotate(-6deg)`, opacity: 1, offset: 0.87 },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale * 0.72})`, opacity: 0, offset: 1 },
      ] : [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 1 },
      ], { duration: impact ? 440 : 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' });
      animation.onfinish = () => clone.remove();
      window.setTimeout(() => clone.remove(), 520);
    }
    if (e.type === 'invalid') { sfx('invalid'); e.ids.forEach((i) => shake(document.querySelector(`[data-tile="${i}"]`))); if (e.cell !== undefined) shake(document.querySelector(`[data-cell="${e.cell}"]`)); }
    if (e.type === 'mark' || e.type === 'erase') { sfx(e.type === 'mark' ? 'place' : 'erase'); const c = centerOf(`[data-cell="${e.cell}"]`); if (c) burst(c[0], c[1], COL[s.turn === 0 ? 1 : 0], 10); }
    if (e.type === 'draw') sfx('draw');
    if (e.type === 'win') {
      sfx('win');
      s.line?.forEach((i) => { const c = centerOf(`[data-cell="${i}"]`); if (c) burst(c[0], c[1], COL[s.winner as number], 28); });
    }
  }, [s.ev]);

  useEffect(() => {
    if (s.phase === 'complete' || s.phase === 'timeout' || s.phase === 'rackfull' || s.phase === 'stuck') {
      onSoloResult(s.phase === 'complete', cfg.campaignStage);
      const id = window.setTimeout(() => setShowEnd(true), 400);
      return () => clearTimeout(id);
    }
    if (s.phase !== 'over') { setShowEnd(false); return; }
    onResult(s.winner as Player | 'draw');
    const id = window.setTimeout(() => setShowEnd(true), 1200);
    return () => clearTimeout(id);
  }, [s.phase]);

  const human = !isAI && !s.paused && s.phase !== 'penalty';
  const timerProgress = Math.max(0, Math.min(1, timeLeft / moveSeconds(cfg.difficulty)));
  const status =
    s.phase === 'over' ? 'Fim de jogo' :
    s.phase === 'complete' ? 'Nível concluído!' :
    s.phase === 'timeout' ? 'Tempo esgotado' :
    s.phase === 'rackfull' ? 'Espaço cheio: tente outra combinação' :
    s.phase === 'stuck' ? 'Sem mais combinações disponíveis' :
    s.phase === 'penalty' ? 'Par incorreto: turno perdido' :
    s.phase === 'pick' ? (isAI ? 'A IA está escolhendo um par…' : `${names[s.turn]}: toque em duas peças iguais e livres`) :
    s.pending === 'brk' ? `💥 Quebra! ${isAI ? 'A IA joga…' : 'Marque uma casa vazia ou apague uma marca rival'}` :
    s.pending === 'star' ? `⭐ Bônus! ${isAI ? 'A IA joga…' : 'Escolha uma casa'}` : isAI ? 'A IA está escolhendo a casa…' : 'Par feito! Escolha uma casa do 3x3';

  const result = solo ? (s.phase === 'complete' ? 'Nível concluído!' : s.phase === 'rackfull' ? 'Espaço cheio!' : s.phase === 'stuck' ? 'Sem combinações!' : 'Tempo esgotado!') : s.winner === 'draw' ? 'Empate!' : s.winner === null ? '' : cfg.mode === 'ai' ? (s.winner === 0 ? 'Você venceu! 🎉' : 'A IA venceu') : `${names[s.winner]} venceu! 🎉`;

  const selectTile = (id: number) => {
    if (!human) return;
    if (solo && s.tiles[id] && isFree(s.tiles, s.tiles[id])) {
      const tile = s.tiles[id];
      const matchSlot = s.rack.findIndex((rackId) => s.tiles[rackId].sym === tile.sym);
      const slotIndex = matchSlot >= 0 ? matchSlot : s.rack.length;
      const source = document.querySelector<HTMLElement>(`[data-tile="${id}"]`);
      const target = document.querySelector<HTMLElement>(`[data-rack-slot="${slotIndex}"]`);
      if (source && target) {
        const existingPiece = matchSlot >= 0 ? target.querySelector<HTMLElement>('.tile-face')?.parentElement as HTMLElement | null : null;
        if (existingPiece) flyTile(existingPiece, target, true);
        flyTile(source, target, matchSlot >= 0);
        if (matchSlot >= 0) target.animate([
          { boxShadow: '0 0 0 0 rgba(242,193,78,0)' },
          { boxShadow: '0 0 0 5px rgba(242,193,78,.8)' },
          { boxShadow: '0 0 0 0 rgba(242,193,78,0)' },
        ], { duration: 380, easing: 'ease-out' });
      }
    }
    d({ t: 'sel', id });
  };

  return (
    <div className="game">
      <header className="bar">
        <button className="ic" onClick={() => d({ t: 'pause', v: true })} aria-label="Pausar">⏸</button>
        <strong>{campaignStage ? `Fase ${campaignStage.id}/${CAMPAIGN_STAGES.length} · ${campaignStage.title}` : training ? 'Modo treino' : cfg.mode === 'ai' ? 'Contra a IA' : 'Dois jogadores'}</strong>
        <button className={`ic music-control ${!musicOn || !soundEnabled ? 'muted' : ''}`} onClick={toggleMusic} aria-label={musicOn && soundEnabled ? 'Desativar música' : 'Ativar música'} title={musicOn && soundEnabled ? 'Desativar música' : 'Ativar música'}>♫</button>
        <button className="ic" onClick={() => d({ t: 'new', cfg })} aria-label="Reiniciar partida">↻</button>
      </header>
      <section className="players">
        {([0, 1] as Player[]).filter((i) => !((training || solo) && i === 1)).map((i) => (
          <div key={i} className={`chip p${i} ${s.turn === i && s.phase !== 'over' ? 'active' : ''}`}>
            <b>{i === 0 ? '✕' : '○'} {names[i]}</b>
            <span className="pts">{s.scores[i]} pts</span>
            <small>{i === 0 ? wins.p1 : wins.p2} vitórias</small>
          </div>
        ))}
      </section>
      {solo && <div className={`move-timer ${timeLeft <= 8 ? 'urgent' : ''}`} role="timer" aria-label={`${timeLeft} segundos restantes`}>
        <svg className="hourglass-illustration" viewBox="0 0 48 48" aria-hidden="true">
          <defs>
            <clipPath id="top-sand-clip"><rect x="12" y="8" width="24" height={16 * timerProgress} /></clipPath>
            <clipPath id="bottom-sand-clip"><rect x="12" y={24 + 16 * timerProgress} width="24" height={16 * (1 - timerProgress)} /></clipPath>
          </defs>
          <path className="hourglass-frame" d="M8 4h32M8 44h32M11 6v6c0 5 4 9 13 12-9 3-13 7-13 12v6M37 6v6c0 5-4 9-13 12 9 3 13 7 13 12v6" />
          <path className="hourglass-sand" clipPath="url(#top-sand-clip)" d="M14 9h20c-1 6-4 10-10 13-6-3-9-7-10-13Z" />
          <path className="hourglass-sand lower" clipPath="url(#bottom-sand-clip)" d="M14 39h20c-1-6-4-10-10-13-6 3-9 7-10 13Z" />
          <path className="hourglass-stream" d="M24 22v5" />
        </svg>
        <div className="timer-count"><strong>{timeLeft}<small>s</small></strong><span>SEGUNDOS</span></div>
        <div className="timer-level"><b>NÍVEL {cfg.campaignStage ?? 1}</b><small>DIFICULDADE {cfg.difficulty ?? 0}/100</small></div>
      </div>}
      <p className="status" role="status">{s.msg ? `${s.msg} · ` : ''}{status}</p>
      <div className={`stage ${solo ? 'solo-stage' : ''}`}>
        <MahjongBoard tiles={s.tiles} sel={s.sel} hint={s.hint} faceDown={cfg.faceDown} revealed={s.revealed} onTap={selectTile} />
        {solo && <div className="solo-rack" aria-label={`Espaço de peças: ${s.rack.length} de 4`}>
          <div className="rack-heading"><b>PEÇAS SELECIONADAS</b><small>{s.rack.length}/4</small></div>
          <div className="rack-slots">
            {Array.from({ length: 4 }, (_, slot) => {
              const tileId = s.rack[slot];
              const tile = tileId === undefined ? undefined : s.tiles[tileId];
              return <div key={slot} data-rack-slot={slot} className={`rack-slot ${tile ? 'filled' : ''}`} aria-label={tile ? `Peça ${tile.sym}` : 'Espaço vazio'}>{tile && <TileFace sym={tile.sym} />}</div>;
            })}
          </div>
        </div>}
        {!solo && <TicTacToe grid={s.grid} line={s.line} placing={s.phase === 'place' && human} canErase={s.pending === 'brk'} turn={s.turn}
          onPick={(cell) => human && d({ t: 'place', cell })} />}
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
          <p className="final">{solo ? `Pontuação: ${s.scores[0]} · Jogadas: ${s.moves}` : training ? `Pontuação: ${s.scores[0]}` : `${names[0]} ${s.scores[0]} × ${s.scores[1]} ${names[1]}`}</p>
          {solo && s.phase === 'complete' && cfg.campaignStage && cfg.campaignStage < CAMPAIGN_STAGES.length && <button className="btn" onClick={onNext}>Próximo nível →</button>}
          {campaignStage && s.winner === 0 && campaignStage.id < CAMPAIGN_STAGES.length && <button className="btn" onClick={onNext}>Próxima fase →</button>}
          <button className="btn" onClick={() => d({ t: 'new', cfg })}>{solo ? s.phase === 'complete' ? 'Repetir nível' : 'Tentar novamente' : 'Jogar novamente'}</button>
          <button className="btn ghost" onClick={onExit}>{campaignStage ? 'Mapa da campanha' : 'Menu principal'}</button>
        </Modal>
      )}
    </div>
  );
}
