import { useEffect, useRef, useState } from 'react';
import { Config, Level, Mode, Player } from './game/types';
import { Settings, Stats, defaultStats, load, save } from './game/store';
import { setSound } from './game/fx';
import { difficultyForWins } from './game/ai';
import { CAMPAIGN_STAGES, CHALLENGE_LAYOUT, campaignDifficulty } from './game/tiles';
import Game from './components/Game';
import { CampaignPick, How, LevelPick, Menu, SettingsScreen } from './components/Screens';

type Screen = 'menu' | 'ailevel' | 'campaign' | 'how' | 'settings' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [cfg, setCfg] = useState<Config>({ mode: 'ai', level: 'medium' });
  const [run, setRun] = useState(0); // muda a key do <Game> para remontar
  const [musicOn, setMusicOn] = useState(true);
  const [gamePaused, setGamePaused] = useState(false);
  const musicRef = useRef<HTMLAudioElement>(null);
  const [settings, setSettings] = useState<Settings>(() => load<Settings>('settings', { sound: true, level: 'medium' }));
  const [stats, setStats] = useState<Stats>(() => load<Stats>('stats', defaultStats()));
  const [campaign, setCampaign] = useState(() => load<{ unlocked: number; completed: boolean }>('campaign', { unlocked: 1, completed: false }));

  useEffect(() => { save('settings', settings); setSound(settings.sound); }, [settings]);
  useEffect(() => save('stats', stats), [stats]);
  useEffect(() => save('campaign', campaign), [campaign]);
  useEffect(() => {
    const audio = musicRef.current;
    if (!audio) return;
    audio.volume = 0.28;
    if (!settings.sound || !musicOn || gamePaused) {
      audio.pause();
      return;
    }

    const startMusic = () => {
      void audio.play().then(() => {
        window.removeEventListener('pointerdown', startMusic);
        window.removeEventListener('keydown', startMusic);
      }).catch(() => {});
    };
    window.addEventListener('pointerdown', startMusic);
    window.addEventListener('keydown', startMusic);
    startMusic();
    return () => {
      window.removeEventListener('pointerdown', startMusic);
      window.removeEventListener('keydown', startMusic);
    };
  }, [settings.sound, musicOn, gamePaused]);

  const play = (mode: Mode, level: Level = settings.level) => {
    setCfg({ mode, level, aiDifficulty: mode === 'ai' ? difficultyForWins(stats.ai.p1) : undefined });
    setRun((r) => r + 1);
    setScreen('game');
  };
  const onResult = (w: Player | 'draw') => {
    if (cfg.mode === 'training' || cfg.mode === 'solo') return;
    setStats((s) => ({ ...s, [cfg.mode]: { ...s[cfg.mode], p1: s[cfg.mode].p1 + (w === 0 ? 1 : 0), p2: s[cfg.mode].p2 + (w === 1 ? 1 : 0), draws: s[cfg.mode].draws + (w === 'draw' ? 1 : 0) } }));
    if (cfg.campaignStage && w === 0) setCampaign((p) => ({
      unlocked: Math.max(p.unlocked, Math.min(CAMPAIGN_STAGES.length, cfg.campaignStage! + 1)),
      completed: p.completed || cfg.campaignStage === CAMPAIGN_STAGES.length,
    }));
  };
  const onSoloResult = (completed: boolean, stage?: number) => {
    setStats((s) => ({ ...s, solo: { ...s.solo, p1: s.solo.p1 + (completed ? 1 : 0), p2: s.solo.p2 + (completed ? 0 : 1) } }));
    if (completed && stage) setCampaign((p) => ({
      unlocked: Math.max(p.unlocked, Math.min(CAMPAIGN_STAGES.length, stage + 1)),
      completed: p.completed || stage === CAMPAIGN_STAGES.length,
    }));
  };
  const go = (a: string) => {
    if (a === 'play') play('ai');
    else if (a === 'challenge') {
      setCfg({ mode: 'ai', level: 'easy', aiDifficulty: difficultyForWins(stats.ai.p1), boardLayout: CHALLENGE_LAYOUT, faceDown: true });
      setRun((r) => r + 1);
      setScreen('game');
    }
    else if (a === 'training') play(a);
    else setScreen(a as Screen);
  };
  const startCampaign = (stage: number) => {
    setCfg({ mode: 'solo', level: 'easy', difficulty: campaignDifficulty(stage), campaignStage: stage });
    setRun((r) => r + 1);
    setScreen('game');
  };

  return (
    <div className="app">
      <audio ref={musicRef} src={new URL('./music/Jardim de Vidro.mp3', import.meta.url).href} loop preload="auto" />
      {screen === 'menu' && <Menu stats={stats} go={go} />}
      {screen === 'ailevel' && <LevelPick start={(l) => play('ai', l)} back={() => setScreen('menu')} />}
      {screen === 'campaign' && <CampaignPick unlocked={campaign.unlocked} completed={campaign.completed} aiDifficulty={difficultyForWins(stats.ai.p1)} start={startCampaign} back={() => setScreen('menu')} />}
      {screen === 'how' && <How back={() => setScreen('menu')} />}
      {screen === 'settings' && <SettingsScreen settings={settings} set={setSettings} reset={() => setStats(defaultStats())} back={() => setScreen('menu')} />}
      {screen === 'game' && <Game key={run} cfg={cfg} wins={stats[cfg.mode]} soundEnabled={settings.sound} musicOn={musicOn} toggleMusic={() => setMusicOn((on) => !on)} onGamePaused={setGamePaused} onResult={onResult} onSoloResult={onSoloResult} onExit={() => setScreen(cfg.campaignStage ? 'campaign' : 'menu')} onNext={() => startCampaign((cfg.campaignStage ?? 0) + 1)} />}
    </div>
  );
}
