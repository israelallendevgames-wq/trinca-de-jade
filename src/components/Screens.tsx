import { useState } from 'react';
import { Level } from '../game/types';
import { Settings, Stats } from '../game/store';
import { CAMPAIGN_STAGES, campaignDifficulty } from '../game/tiles';
import { BACKGROUND_COUNT, GAME_BACKGROUNDS } from '../game/backgrounds';
import { RewardedAdResult } from '../game/rewardAds';
import { LANGUAGES, Language, translations } from '../i18n';

export function LanguageScreen({ language, onSelect }: { language: Language; onSelect: (value: Language) => void }) {
  return (
    <main className="screen menu">
      <div className="logo" aria-hidden>
        <span>✕</span><span className="j">🀄</span><span>○</span>
      </div>
      <h1>Escolha a língua</h1>
      <p className="sub">Select your language · Elige tu idioma · Choisissez votre langue</p>
      {LANGUAGES.map(({ code, label }) => (
        <button key={code} className="btn" onClick={() => onSelect(code)}>{label}</button>
      ))}
    </main>
  );
}

export function Menu({ stats, go, language }: { stats: Stats; go: (a: string) => void; language: Language }) {
  const st = stats.ai;
  const t = translations[language].menu;
  return (
    <main className="screen menu">
      <div className="logo" aria-hidden>
        <span>✕</span><span className="j">🀄</span><span>○</span>
      </div>
      <h1>Trinca de Jade</h1>
      <p className="sub">{translations[language].menu.slogan}</p>
      <button className="btn campaign-entry" onClick={() => go('campaign')}>{t.play}</button>
      <button className="btn" onClick={() => go('challenge')}>{t.challenge}</button>
      <div className="row">
        <button className="btn ghost" onClick={() => go('settings')}>{t.settings}</button>
      </div>
      <button className="btn ghost" onClick={() => go('backgrounds')}>{t.backgrounds}</button>
      <p className="stats">{t.stats.replace('{p1}', String(st.p1)).replace('{p2}', String(st.p2)).replace('{p3}', String(st.draws))}</p>
    </main>
  );
}

export function CampaignPick({ unlocked, completed, aiDifficulty, start, back, language }: {
  unlocked: number; completed: boolean; aiDifficulty: number; start: (stage: number) => void; back: () => void; language: Language;
}) {
  const t = translations[language].campaign;
  return (
    <main className="screen menu campaign-screen">
      <h2>{t.title}</h2>
      <p className="sub">{t.subtitle}</p>
      <div className="campaign-progress" aria-label={t.progress.replace('{done}', String(completed ? CAMPAIGN_STAGES.length : unlocked - 1)).replace('{total}', String(CAMPAIGN_STAGES.length))}>
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
              <span className="stage-state">{done ? t.done : locked ? t.locked : t.stageState}</span>
            </button>
          );
        })}
      </div>
      {completed && <p className="campaign-complete">{t.completed}</p>}
      <button className="btn ghost" onClick={back}>{t.back}</button>
    </main>
  );
}

export function LevelPick({ start, back, language }: { start: (l: Level) => void; back: () => void; language: Language }) {
  const t = translations[language].levels;
  return (
    <main className="screen menu">
      <h2>{t.title}</h2>
      <button className="btn" onClick={() => start('easy')}>{t.easy}</button>
      <button className="btn" onClick={() => start('medium')}>{t.medium}</button>
      <button className="btn" onClick={() => start('hard')}>{t.hard}</button>
      <button className="btn ghost" onClick={back}>{t.back}</button>
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

export function SettingsScreen({ settings, set, reset, back, language, setLanguage }: { settings: Settings; set: (s: Settings) => void; reset: () => void; back: () => void; language: Language; setLanguage: (l: Language) => void }) {
  const t = translations[language].settings;
  return (
    <main className="screen text">
      <h2>{t.title}</h2>
      <label className="opt"><span>{t.language}</span>
        <select value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
          {LANGUAGES.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
        </select></label>
      <label className="opt"><span>{t.sound}</span>
        <input type="checkbox" checked={settings.sound} onChange={(e) => set({ ...settings, sound: e.target.checked })} /></label>
      <label className="opt"><span>{t.level}</span>
        <select value={settings.level} onChange={(e) => set({ ...settings, level: e.target.value as Level })}>
          <option value="easy">Fácil</option><option value="medium">Médio</option><option value="hard">Difícil</option>
        </select></label>
      <button className="btn ghost" onClick={() => confirm('Zerar todas as vitórias?') && reset()}>{t.reset}</button>
      <button className="btn" onClick={back}>{t.back}</button>
    </main>
  );
}

export function BackgroundsScreen({ unlockedCount, selectedId, onSelect, onUnlock, back, language }: {
  unlockedCount: number; selectedId: number | null; onSelect: (id: number | null) => void;
  onUnlock: () => Promise<RewardedAdResult>; back: () => void; language: Language;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const t = translations[language];
  const unlockNext = async () => {
    if (busy || unlockedCount >= BACKGROUND_COUNT) return;
    setBusy(true);
    setMessage('');
    const result = await onUnlock();
    setBusy(false);
    setMessage(result === 'rewarded' ? `Plano ${unlockedCount + 1} liberado e selecionado.` : result === 'unavailable' ? 'Anúncios recompensados indisponíveis neste dispositivo.' : 'Assista ao anúncio até o fim para liberar o próximo plano.');
  };

  return (
    <main className="screen background-screen">
      <div className="background-title-row">
        <div><h2>Planos de fundo</h2><p className="sub">{unlockedCount} de {BACKGROUND_COUNT} liberados · um por anúncio</p></div>
        <button className="btn ghost" onClick={back}>Voltar</button>
      </div>
      <div className="background-unlock-row">
        <button className="btn campaign-entry" disabled={busy || unlockedCount >= BACKGROUND_COUNT} onClick={unlockNext}>
          {busy ? 'Carregando anúncio…' : unlockedCount >= BACKGROUND_COUNT ? 'Coleção completa' : `Assistir anúncio e liberar ${GAME_BACKGROUNDS[unlockedCount].name}`}
        </button>
        <button className={`btn ghost original-background ${selectedId === null ? 'selected' : ''}`} aria-pressed={selectedId === null} onClick={() => onSelect(null)}>Fundo original</button>
      </div>
      {message && <p className="background-message" role="status">{message}</p>}
      <div className="background-grid" aria-label="Coleção de planos de fundo">
        {GAME_BACKGROUNDS.map((background) => {
          const unlocked = background.id <= unlockedCount;
          const selected = background.id === selectedId;
          return (
            <button key={background.id} className={`background-card ${unlocked ? '' : 'locked'} ${selected ? 'selected' : ''}`} disabled={!unlocked} aria-pressed={selected}
              onClick={() => onSelect(background.id)}>
              <span className="background-preview" style={{ backgroundImage: background.image }} />
              <span className="background-card-label"><b>{background.name}</b><small>{selected ? 'Em uso' : unlocked ? 'Liberado' : `Bloqueado · ${background.id}/60`}</small></span>
            </button>
          );
        })}
      </div>
    </main>
  );
}
