import { Level } from '../game/types';
import { Settings, Stats } from '../game/store';
import { CAMPAIGN_STAGES, campaignDifficulty } from '../game/tiles';

export function Menu({ stats, go }: { stats: Stats; go: (a: string) => void }) {
  const st = stats.ai;
  return (
    <main className="screen menu">
      <div className="logo" aria-hidden>
        <span>✕</span><span className="j">🀄</span><span>○</span>
      </div>
      <h1>Trinca de Jade</h1>
      <p className="sub">Combine peças. Conquiste a linha.</p>
      <button className="btn campaign-entry" onClick={() => go('campaign')}>Jogar</button>
      <button className="btn" onClick={() => go('challenge')}>Desafio contra IA</button>
      <button className="btn ghost" onClick={() => go('training')}>Modo treino</button>
      <div className="row">
        <button className="btn ghost" onClick={() => go('how')}>Como jogar</button>
        <button className="btn ghost" onClick={() => go('settings')}>Configurações</button>
      </div>
      <p className="stats">Contra a IA: {st.p1} vitórias · {st.p2} derrotas · {st.draws} empates</p>
    </main>
  );
}

export function CampaignPick({ unlocked, completed, aiDifficulty, start, back }: {
  unlocked: number; completed: boolean; aiDifficulty: number; start: (stage: number) => void; back: () => void;
}) {
  return (
    <main className="screen menu campaign-screen">
      <h2>Campanha</h2>
      <p className="sub">Desbloqueie as oito fases vencendo a IA.</p>
      <div className="campaign-progress" aria-label={`${completed ? CAMPAIGN_STAGES.length : unlocked - 1} de ${CAMPAIGN_STAGES.length} fases concluídas`}>
        <span style={{ width: `${(completed ? CAMPAIGN_STAGES.length : unlocked - 1) / CAMPAIGN_STAGES.length * 100}%` }} />
      </div>
      <div className="campaign-list">
        {CAMPAIGN_STAGES.map((stage) => {
          const locked = stage.id > unlocked;
          const done = stage.id < unlocked || (completed && stage.id === CAMPAIGN_STAGES.length);
          return (
            <button key={stage.id} className={`stage-card ${locked ? 'locked' : ''} ${done ? 'done' : ''}`} disabled={locked}
              onClick={() => start(stage.id)}>
              <span className="stage-number">{done ? '✓' : locked ? '🔒' : String(stage.id).padStart(2, '0')}</span>
              <span className="stage-copy"><b>{stage.title}</b><small>{stage.subtitle}</small><small>Nível {stage.id} · Dificuldade {campaignDifficulty(stage.id)}/100 · {stage.layout.length} peças</small></span>
              <span className="stage-state">{done ? 'Concluída' : locked ? 'Bloqueada' : 'Jogar'}</span>
            </button>
          );
        })}
      </div>
      {completed && <p className="campaign-complete">🏆 Campanha concluída! Você pode rejogar qualquer fase.</p>}
      <button className="btn ghost" onClick={back}>Voltar</button>
    </main>
  );
}

export function LevelPick({ start, back }: { start: (l: Level) => void; back: () => void }) {
  return (
    <main className="screen menu">
      <h2>Dificuldade da IA</h2>
      <button className="btn" onClick={() => start('easy')}>Fácil</button>
      <button className="btn" onClick={() => start('medium')}>Médio</button>
      <button className="btn" onClick={() => start('hard')}>Difícil</button>
      <button className="btn ghost" onClick={back}>Voltar</button>
    </main>
  );
}

export function How({ back }: { back: () => void }) {
  return (
    <main className="screen text">
      <h2>Como jogar</h2>
      <ol>
        <li><b>Seu turno tem duas fases.</b> Primeiro tire um par de peças iguais; depois marque uma casa do 3x3.</li>
        <li><b>Peça livre:</b> nada em cima e pelo menos um lado (esquerdo ou direito) aberto. Peças bloqueadas ficam escuras.</li>
        <li><b>Vence</b> quem fizer 3 marcações em linha (horizontal, vertical ou diagonal). Se as 9 casas encherem, é empate.</li>
        <li><b>Pontos:</b> par comum 10 · ⭐ vale 20 · 💥 vale 15 e deixa você apagar uma marca do rival em vez de marcar · vitória +50.</li>
        <li><b>Estratégia:</b> cada par que você retira libera peças para o adversário. Escolha o par e a casa pensando em atacar ou bloquear.</li>
        <li><b>Dica</b> mostra um par disponível (custa 5 pontos, exceto no treino). Sem pares possíveis, o tabuleiro se embaralha sozinho.</li>
      </ol>
      <button className="btn" onClick={back}>Entendi</button>
    </main>
  );
}

export function SettingsScreen({ settings, set, reset, back }: { settings: Settings; set: (s: Settings) => void; reset: () => void; back: () => void }) {
  return (
    <main className="screen text">
      <h2>Configurações</h2>
      <label className="opt"><span>Sons</span>
        <input type="checkbox" checked={settings.sound} onChange={(e) => set({ ...settings, sound: e.target.checked })} /></label>
      <label className="opt"><span>Dificuldade do botão Jogar</span>
        <select value={settings.level} onChange={(e) => set({ ...settings, level: e.target.value as Level })}>
          <option value="easy">Fácil</option><option value="medium">Médio</option><option value="hard">Difícil</option>
        </select></label>
      <button className="btn ghost" onClick={() => confirm('Zerar todas as vitórias?') && reset()}>Zerar placar</button>
      <button className="btn" onClick={back}>Voltar</button>
    </main>
  );
}
