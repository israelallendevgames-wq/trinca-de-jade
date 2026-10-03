import { ReactNode, useEffect, useReducer, useRef, useState } from 'react';
import { Config, Level, Player } from '../game/types';
import { init, reduce } from '../game/state';
import { aiCell, aiPair } from '../game/ai';
import { isFree } from '../game/tiles';
import { CAMPAIGN_STAGES } from '../game/tiles';
import { burst, centerOf, sfx, shake } from '../game/fx';
import { showRewardedAd } from '../game/rewardAds';
import MahjongBoard, { TileFace } from './MahjongBoard';
import TicTacToe from './TicTacToe';
import { brainBoostMessages, Language, translations } from '../i18n';

interface Props { cfg: Config; wins: { p1: number; p2: number; draws: number }; soloSupplies: { hints: number; shuffles: number }; onUseSoloSupply: (supply: 'hints' | 'shuffles') => void; onEarnSoloSupply: (supply: 'hints' | 'shuffles') => void; soundEnabled: boolean; musicOn: boolean; toggleMusic: () => void; onGamePaused: (paused: boolean) => void; onResult: (w: Player | 'draw') => void; onSoloResult: (completed: boolean, stage?: number) => void; onExit: () => void; onNext: () => void; language: Language }
const LV: Record<Level, string> = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil', expert: 'Especialista', master: 'Mestre' };
const COL = ['#ff7a59', '#4fe0c8'];
const moveSeconds = (difficulty = 0) => Math.max(15, 60 - Math.round(difficulty * 0.45));

function Modal({ title, children }: { title: string; children: ReactNode }) {
  return <div className="overlay"><div className="modal"><h2>{title}</h2>{children}</div></div>;
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
  const frames = impact ? [
    { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0 },
    { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 1, offset: 0.78 },
    { transform: `translate(${dx - 5}px, ${dy}px) scale(${scale * 1.08}) rotate(-6deg)`, opacity: 1, offset: 0.87 },
    { transform: `translate(${dx}px, ${dy}px) scale(${scale * 0.72})`, opacity: 0, offset: 1 },
  ] : [
    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
    { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 1 },
  ];
  const animation = clone.animate(frames, { duration: impact ? 440 : 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' });
  animation.onfinish = () => clone.remove();
  window.setTimeout(() => clone.remove(), 520);
}

export default function Game({ cfg, wins, soloSupplies, onUseSoloSupply, onEarnSoloSupply, soundEnabled, musicOn, toggleMusic, onGamePaused, onResult, onSoloResult, onExit, onNext, language }: Props) {
  const [s, d] = useReducer(reduce, cfg, init);
  const previousTurn = useRef(s.turn);
  const [showEnd, setShowEnd] = useState(false);
  const [adBusy, setAdBusy] = useState(false);
  const [adMessage, setAdMessage] = useState('');
  const challenge = cfg.mode === 'ai' && cfg.challengeRound !== undefined;
  const [timeLeft, setTimeLeft] = useState(() => challenge ? 60 : moveSeconds(cfg.difficulty));
  const t = translations[language];
  const solo = cfg.mode === 'solo';
  const campaignStage = cfg.campaignStage ? CAMPAIGN_STAGES[cfg.campaignStage - 1] : undefined;
  const levelName = (level: Level) => ({ easy: t.levels.easy, medium: t.levels.medium, hard: t.levels.hard } as Record<Level, string>)[level];
  const names = cfg.mode === 'ai' ? [t.game.you, cfg.aiDifficulty === undefined ? `${t.game.ai} ${levelName(cfg.level)}` : `${t.game.ai} ${cfg.aiDifficulty}`] : [t.game.player1, t.game.player2];
  const isAI = cfg.mode === 'ai' && s.turn === 1 && s.phase !== 'over' && s.phase !== 'penalty';
  const motivationStage = solo ? (cfg.campaignStage ?? 1) : Math.max(1, Math.min(8, Math.round((cfg.difficulty ?? 0) / 12)));
  const brainBoost = brainBoostMessages[language][Math.max(0, Math.min(brainBoostMessages[language].length - 1, motivationStage - 1))];

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
    const running = solo ? s.phase === 'pick' : challenge && s.phase !== 'over' && s.phase !== 'timeout';
    if (!running || s.paused) return;
    const id = window.setInterval(() => setTimeLeft((time) => Math.max(0, time - 1)), 1000);
    return () => clearInterval(id);
  }, [solo, challenge, s.phase, s.paused]);

  useEffect(() => {
    if (challenge && previousTurn.current !== s.turn) setTimeLeft(60);
    previousTurn.current = s.turn;
  }, [challenge, s.turn]);

  useEffect(() => { if (solo) setTimeLeft(moveSeconds(cfg.difficulty)); }, [solo, cfg.difficulty, s.tiles]);

  useEffect(() => {
    if (s.paused || timeLeft !== 0) return;
    if (solo && s.phase === 'pick' || challenge && s.phase !== 'over' && s.phase !== 'timeout') d({ t: 'timeout' });
  }, [solo, challenge, s.phase, s.paused, timeLeft]);

  useEffect(() => { if (s.sel !== null) sfx('select'); }, [s.sel]);

  // Efeitos visuais e sonoros reagem aos eventos do reducer.
  useEffect(() => {
    const e = s.ev; if (!e) return;
    if (e.type === 'match') {
      sfx(solo ? 'domino' : 'match');
      if (solo && e.cell !== undefined) { const c = centerOf(`[data-rack-slot="${e.cell}"]`); if (c) burst(c[0], c[1], '#f2c14e', 10); }
      else e.ids.forEach((i) => { const c = centerOf(`[data-tile="${i}"]`); if (c) burst(c[0], c[1], '#f2c14e'); });
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
    if (solo && (s.phase === 'complete' || s.phase === 'timeout' || s.phase === 'rackfull' || s.phase === 'stuck')) {
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
  const timerDuration = challenge ? 60 : moveSeconds(cfg.difficulty);
  const timerProgress = Math.max(0, Math.min(1, timeLeft / timerDuration));
  const status =
    s.phase === 'over' ? t.game.status.end :
    s.phase === 'complete' ? t.game.status.levelComplete :
    s.phase === 'timeout' ? t.game.status.timeout :
    s.phase === 'rackfull' ? t.game.status.rackfull :
    s.phase === 'stuck' ? t.game.status.stuck :
    s.phase === 'penalty' ? t.game.status.penalty :
    s.phase === 'pick' ? (isAI ? t.game.status.aiPick : t.game.status.pick.replace('{name}', names[s.turn])) :
    s.pending === 'brk' ? t.game.status.brk.replace('{who}', isAI ? t.game.ai : 'marque uma casa vazia ou apague uma marca rival') :
    s.pending === 'star' ? t.game.status.star.replace('{who}', isAI ? t.game.ai : 'escolha uma casa') : isAI ? t.game.status.aiPlace : t.game.status.place;

  const result = solo ? (s.phase === 'complete' ? t.game.status.levelComplete : s.phase === 'rackfull' ? 'Espaço cheio!' : s.phase === 'stuck' ? 'Sem combinações!' : t.game.status.timeout) : s.winner === 'draw' ? t.game.draw : s.winner === null ? '' : cfg.mode === 'ai' ? (s.winner === 0 ? t.game.youWon : t.game.aiWon) : `${names[s.winner]} venceu! 🎉`;

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
  const useHint = () => {
    if (solo && soloSupplies.hints === 0) return;
    d({ t: 'hint' });
    if (solo) onUseSoloSupply('hints');
  };
  const useShuffle = () => {
    if (soloSupplies.shuffles === 0) return;
    d({ t: 'shuffle' });
    onUseSoloSupply('shuffles');
  };
  const restartGame = () => {
    setTimeLeft(challenge ? 60 : moveSeconds(cfg.difficulty));
    d({ t: 'new', cfg });
  };
  const requestSupplyAd = async (supply: 'hints' | 'shuffles') => {
    if (adBusy) return;
    setAdBusy(true);
    setAdMessage('');
    const result = await showRewardedAd(supply === 'hints' ? 'extra-hint' : 'extra-shuffle');
    setAdBusy(false);
    if (result === 'rewarded') {
      onEarnSoloSupply(supply);
      setAdMessage(supply === 'hints' ? '+1 dica adicionada.' : '+1 embaralhamento adicionado.');
    } else {
      setAdMessage(result === 'unavailable' ? 'Anúncios recompensados indisponíveis neste dispositivo.' : 'Assista ao anúncio até o fim para receber a recompensa.');
    }
  };

  return (
    <div className="game">
      <header className="bar">
        <button className="ic" onClick={() => d({ t: 'pause', v: true })} aria-label={t.game.pause}>⏸</button>
        <strong>{campaignStage ? `Fase ${campaignStage.id}/${CAMPAIGN_STAGES.length} · ${campaignStage.title}` : cfg.mode === 'ai' ? t.game.againstAI : t.game.twoPlayers}</strong>
        <button className={`ic music-control ${!musicOn || !soundEnabled ? 'muted' : ''}`} onClick={toggleMusic} aria-label={musicOn && soundEnabled ? t.game.musicOff : t.game.musicOn} title={musicOn && soundEnabled ? t.game.musicOff : t.game.musicOn}>♫</button>
        <button className="ic" onClick={restartGame} aria-label={t.game.restart}>↻</button>
      </header>
      <section className="players">
        {([0, 1] as Player[]).filter((i) => !(solo && i === 1)).map((i) => (
          <div key={i} className={`chip p${i} ${s.turn === i && s.phase !== 'over' ? 'active' : ''}`}>
            <b>{i === 0 ? '✕' : '○'} {names[i]}</b>
            <span className="pts">{s.scores[i]} {t.game.points}</span>
            <small>{i === 0 ? wins.p1 : wins.p2} {t.game.wins}</small>
          </div>
        ))}
      </section>
      {(solo || challenge) && <div className={`move-timer ${timeLeft <= 8 ? 'urgent' : ''}`} role="timer" aria-label={`${timeLeft} ${t.game.seconds}`}>
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
        <div className="timer-count"><strong>{timeLeft}<small>s</small></strong><span>{t.game.seconds}</span></div>
        <div className="timer-level">{challenge ? <><b>{t.game.round} {cfg.challengeRound}</b><small>{s.tiles.length} {t.game.pieces}</small></> : <><b>NÍVEL {cfg.campaignStage ?? 1}</b><small>DIFICULDADE {cfg.difficulty ?? 0}/100</small></>}</div>
      </div>}
      <p className="status" role="status">{s.msg ? `${s.msg} · ` : ''}{status}</p>
      {brainBoost && (
        <div className="brain-tip" aria-live="polite">
          <strong>{brainBoost.title}</strong>
          <span>{brainBoost.text}</span>
        </div>
      )}
      <div className={`stage ${solo ? 'solo-stage' : 'challenge-stage'}`}>
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
        <button className="btn ghost" disabled={!human || s.phase !== 'pick' || (solo && soloSupplies.hints === 0)} onClick={useHint}>{solo ? `💡 Dica (${soloSupplies.hints})` : '💡 Dica (−5)'}</button>
        {solo && <button className="btn ghost" disabled={!human || s.phase !== 'pick' || soloSupplies.shuffles === 0} onClick={useShuffle}>🔀 Embaralhar ({soloSupplies.shuffles})</button>}
        {solo && <div className="reward-ad-actions">
          <button className="btn ghost ad-reward" disabled={adBusy} onClick={() => requestSupplyAd('hints')}>{adBusy ? 'Carregando anúncio…' : 'Ver anúncio para +1 dica'}</button>
          <button className="btn ghost ad-reward" disabled={adBusy} onClick={() => requestSupplyAd('shuffles')}>{adBusy ? 'Carregando anúncio…' : 'Ver anúncio para +1 embaralhamento'}</button>
          {adMessage && <p className="reward-ad-message" role="status">{adMessage}</p>}
        </div>}
      </footer>

      {s.paused && (
        <Modal title={t.game.paused}>
          <button className="btn" onClick={() => d({ t: 'pause', v: false })}>{t.game.continue}</button>
          <button className="btn ghost" onClick={restartGame}>{t.game.restartMatch}</button>
          <button className="btn ghost" onClick={onExit}>{campaignStage ? 'Mapa da campanha' : t.game.menu}</button>
        </Modal>
      )}
      {showEnd && (
        <Modal title={result}>
          <p className="final">{solo ? `Pontuação: ${s.scores[0]} · Jogadas: ${s.moves}` : `${names[0]} ${s.scores[0]} × ${s.scores[1]} ${names[1]}`}</p>
          {challenge && s.phase === 'over' && s.winner === 0 && <button className="btn" onClick={onNext}>{t.game.nextRound}</button>}
          {solo && s.phase === 'complete' && cfg.campaignStage && cfg.campaignStage < CAMPAIGN_STAGES.length && <button className="btn" onClick={onNext}>{t.game.next}</button>}
          {campaignStage && s.winner === 0 && campaignStage.id < CAMPAIGN_STAGES.length && <button className="btn" onClick={onNext}>{t.game.nextStage}</button>}
          <button className="btn" onClick={restartGame}>{solo ? s.phase === 'complete' ? 'Repetir nível' : t.game.tryAgain : challenge && s.phase === 'timeout' ? t.game.tryAgain : t.game.again}</button>
          <button className="btn ghost" onClick={onExit}>{campaignStage ? 'Mapa da campanha' : t.game.menu}</button>
        </Modal>
      )}
    </div>
  );
}
