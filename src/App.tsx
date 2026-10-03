import { useEffect, useRef, useState } from 'react';
import { Config, Level, Mode, Player } from './game/types';
import { Settings, Stats, defaultStats, load, save } from './game/store';
import { setSound } from './game/fx';
import { difficultyForWins, levelAtDifficulty } from './game/ai';
import { CAMPAIGN_STAGES, CHALLENGE_LAYOUT, HARDER_LEVEL_LAYOUT, MAX_CHALLENGE_ROUND, campaignDifficulty, challengeLayout } from './game/tiles';
import { BACKGROUND_COUNT, GAME_BACKGROUNDS } from './game/backgrounds';
import { showRewardedAd } from './game/rewardAds';
import Game from './components/Game';
import { BackgroundsScreen, CampaignPick, How, LanguageScreen, LevelPick, Menu, SettingsScreen } from './components/Screens';
import { Language, translations } from './i18n';

type Screen = 'language' | 'menu' | 'ailevel' | 'campaign' | 'backgrounds' | 'how' | 'settings' | 'game';
type SoloSupplies = { hints: number; shuffles: number };
type BackgroundCollection = { unlockedCount: number; selectedId: number | null };

export default function App() {
  const [screen, setScreen] = useState<Screen>('language');
  const [cfg, setCfg] = useState<Config>({ mode: 'ai', level: 'medium' });
  const [language, setLanguage] = useState<Language>('pt');
  const [run, setRun] = useState(0); // muda a key do <Game> para remontar
  const [musicOn, setMusicOn] = useState(true);
  const [gamePaused, setGamePaused] = useState(false);
  const musicRef = useRef<HTMLAudioElement>(null);
  const [settings, setSettings] = useState<Settings>(() => load<Settings>('settings', { sound: true, level: 'medium' }));
  const [stats, setStats] = useState<Stats>(() => load<Stats>('stats', defaultStats()));
  const [challengeRound, setChallengeRound] = useState(() => {
    const saved = load<{ round: number }>('challenge-round', { round: 1 }).round;
    return Math.max(1, Math.min(MAX_CHALLENGE_ROUND, Math.floor(saved) || 1));
  });
  const [campaign, setCampaign] = useState(() => load<{ unlocked: number; completed: boolean }>('campaign', { unlocked: 1, completed: false }));
  const [soloSupplies, setSoloSupplies] = useState<SoloSupplies>(() => load<SoloSupplies>('solo-supplies', { hints: 5, shuffles: 5 }));
  const [backgroundCollection, setBackgroundCollection] = useState<BackgroundCollection>(() => load<BackgroundCollection>('backgrounds', { unlockedCount: 0, selectedId: null }));

  useEffect(() => { save('settings', settings); setSound(settings.sound); }, [settings]);
  useEffect(() => save('stats', stats), [stats]);
  useEffect(() => save('challenge-round', { round: challengeRound }), [challengeRound]);
  useEffect(() => save('campaign', campaign), [campaign]);
  useEffect(() => save('solo-supplies', soloSupplies), [soloSupplies]);
  useEffect(() => save('backgrounds', backgroundCollection), [backgroundCollection]);
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
    const harderLevels: Level[] = ['hard', 'expert', 'master'];
    setCfg({
      mode,
      level,
      aiDifficulty: mode === 'ai' ? difficultyForWins(stats.ai.p1) : undefined,
      boardLayout: mode === 'ai' && harderLevels.includes(level) ? HARDER_LEVEL_LAYOUT : undefined,
      faceDown: mode === 'ai' && harderLevels.includes(level),
    });
    setRun((r) => r + 1);
    setScreen('game');
  };
  const startChallenge = () => {
    const challengeDifficulty = challengeRound;
    setCfg({ mode: 'ai', level: 'hard', aiDifficulty: challengeDifficulty, boardLayout: challengeLayout(challengeRound), faceDown: levelAtDifficulty(challengeDifficulty) === 'hard', challengeRound });
    setRun((r) => r + 1);
    setScreen('game');
  };
  const onResult = (w: Player | 'draw') => {
    if (cfg.mode === 'solo') return;
    setStats((s) => ({ ...s, [cfg.mode]: { ...s[cfg.mode], p1: s[cfg.mode].p1 + (w === 0 ? 1 : 0), p2: s[cfg.mode].p2 + (w === 1 ? 1 : 0), draws: s[cfg.mode].draws + (w === 'draw' ? 1 : 0) } }));
    if (cfg.challengeRound !== undefined && w === 0) setChallengeRound((round) => Math.min(MAX_CHALLENGE_ROUND, Math.max(round, cfg.challengeRound! + 1)));
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
  const useSoloSupply = (supply: keyof SoloSupplies) => {
    setSoloSupplies((current) => ({ ...current, [supply]: Math.max(0, current[supply] - 1) }));
  };
  const earnSoloSupply = (supply: keyof SoloSupplies) => {
    setSoloSupplies((current) => ({ ...current, [supply]: current[supply] + 1 }));
  };
  const unlockBackground = async () => {
    const result = await showRewardedAd('background-unlock');
    if (result === 'rewarded') setBackgroundCollection((current) => {
      if (current.unlockedCount >= BACKGROUND_COUNT) return current;
      const unlockedCount = current.unlockedCount + 1;
      return { unlockedCount, selectedId: unlockedCount };
    });
    return result;
  };
  const selectedBackground = GAME_BACKGROUNDS.find((background) => background.id === backgroundCollection.selectedId);
  const t = translations[language];
  const chooseLanguage = (selected: Language) => {
    setLanguage(selected);
    setScreen('menu');
  };
  const go = (a: string) => {
    if (a === 'play') play('ai');
    else if (a === 'challenge') startChallenge();
    else setScreen(a as Screen);
  };
  const startCampaign = (stage: number) => {
    setCfg({ mode: 'solo', level: 'easy', difficulty: campaignDifficulty(stage), campaignStage: stage });
    setRun((r) => r + 1);
    setScreen('game');
  };

  return (
    <div className={`app ${selectedBackground ? 'custom-background' : ''}`} style={selectedBackground ? { backgroundImage: selectedBackground.image } : undefined}>
      <audio ref={musicRef} src={new URL('./music/Jardim de Vidro.mp3', import.meta.url).href} loop preload="auto" />
      {screen === 'language' && <LanguageScreen language={language} onSelect={chooseLanguage} />}
      {screen === 'menu' && <Menu stats={stats} go={go} language={language} />}
      {screen === 'ailevel' && <LevelPick start={(l) => play('ai', l)} back={() => setScreen('menu')} language={language} />}
      {screen === 'campaign' && <CampaignPick unlocked={campaign.unlocked} completed={campaign.completed} aiDifficulty={difficultyForWins(stats.ai.p1)} start={startCampaign} back={() => setScreen('menu')} language={language} />}
      {screen === 'backgrounds' && <BackgroundsScreen unlockedCount={backgroundCollection.unlockedCount} selectedId={backgroundCollection.selectedId} onSelect={(selectedId) => setBackgroundCollection((current) => ({ ...current, selectedId }))} onUnlock={unlockBackground} back={() => setScreen('menu')} language={language} />}
      {screen === 'how' && <How back={() => setScreen('menu')} />}
      {screen === 'settings' && <SettingsScreen settings={settings} set={setSettings} reset={() => { setStats(defaultStats()); setChallengeRound(1); }} back={() => setScreen('menu')} language={language} setLanguage={setLanguage} />}
      {screen === 'game' && <Game key={run} cfg={cfg} wins={stats[cfg.mode]} soloSupplies={soloSupplies} onUseSoloSupply={useSoloSupply} onEarnSoloSupply={earnSoloSupply} soundEnabled={settings.sound} musicOn={musicOn} toggleMusic={() => setMusicOn((on) => !on)} onGamePaused={setGamePaused} onResult={onResult} onSoloResult={onSoloResult} onExit={() => setScreen(cfg.campaignStage ? 'campaign' : 'menu')} onNext={() => cfg.challengeRound ? startChallenge() : startCampaign((cfg.campaignStage ?? 0) + 1)} language={language} />}
    </div>
  );
}
