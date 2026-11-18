import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  Cloud,
  CloudDownload,
  LogIn,
  LogOut,
  Moon,
  Plane,
  Share2,
  Sun,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AnalyticsView } from './components/AnalyticsView';
import { BoardView } from './components/BoardView';
import { CardBattleModal } from './components/CardBattleModal';
import { DailyChallengesView } from './components/DailyChallengesView';
import { GameSetupView, type TrainerDraft } from './components/GameSetupView';
import { LeaderboardView } from './components/LeaderboardView';
import { LegendaryTradeModal } from './components/LegendaryTradeModal';
import { PokedexView } from './components/PokedexView';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';
import { ShareMilestoneModal } from './components/ShareMilestoneModal';
import {
  BOARD_EVENTS,
  BOARD_TILES,
  generateDailyChallenges,
  getTypeMultiplier,
  LEGENDARY_CARDS,
  POKEMON_BY_ID,
  POKEMON_CARDS,
  REGULAR_CARDS,
} from './data/pokemonData';
import {
  auth,
  ensureUserProfile,
  loadGameFromCloud,
  loadMatchHistoryFromCloud,
  loadUserProfile,
  recordMatchToCloud,
  saveGameToCloud,
  signInWithGoogle,
  signOutUser,
  subscribeLeaderboard,
  syncLeaderboardScore,
} from './firebase';
import { useOnlineStatus } from './hooks/usePWA';
import type {
  ActiveBattle,
  AppTab,
  DailyChallenge,
  ElementType,
  GameLogEntry,
  LeaderboardRow,
  MatchAnalyticsRecord,
  PersistedGameState,
  Trainer,
} from './types/game';
import { soundFx } from './utils/sound';

const LS_SAVE_KEY = 'pokepoly_autosave_v1';
const LS_META_KEY = 'pokepoly_meta_v1';
const LS_THEME_KEY = 'pokepoly_theme_v1';

interface LocalMeta {
  pokedexCaught: string[];
  pokedexSeen: string[];
  totalWins: number;
  totalGames: number;
  totalBattlesWon: number;
  totalBattlesPlayed: number;
  dailyStreak: number;
  lastPlayedDate: string;
  bonusXp: number;
  notificationsEnabled: boolean;
  challengesDate: string;
  challenges: DailyChallenge[];
  matchHistory: MatchAnalyticsRecord[];
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadInitialMeta(): LocalMeta {
  const today = getTodayKey();
  const defaults: LocalMeta = {
    pokedexCaught: ['pikachu', 'charizard', 'blastoise', 'venusaur'],
    pokedexSeen: ['pikachu', 'charizard', 'blastoise', 'venusaur', 'onix', 'starmie'],
    totalWins: 1,
    totalGames: 2,
    totalBattlesWon: 5,
    totalBattlesPlayed: 7,
    dailyStreak: 3,
    lastPlayedDate: today,
    bonusXp: 150,
    notificationsEnabled: false,
    challengesDate: today,
    challenges: generateDailyChallenges(today),
    matchHistory: [
      {
        id: 'seed_match_1',
        dateLabel: '2 days ago',
        winnerName: 'Red',
        didWin: true,
        badgesCollected: 5,
        battlesWon: 3,
        battlesPlayed: 4,
        finalNetWorth: 2480,
        favoriteType: 'Electric',
        durationMinutes: 14,
      },
      {
        id: 'seed_match_2',
        dateLabel: 'Yesterday',
        winnerName: 'Blue',
        didWin: false,
        badgesCollected: 3,
        battlesWon: 2,
        battlesPlayed: 3,
        finalNetWorth: 1920,
        favoriteType: 'Fire',
        durationMinutes: 12,
      },
    ],
  };

  try {
    const raw = localStorage.getItem(LS_META_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<LocalMeta>;
    const challenges =
      parsed.challengesDate === today && Array.isArray(parsed.challenges)
        ? parsed.challenges
        : generateDailyChallenges(today);
    return {
      ...defaults,
      ...parsed,
      challengesDate: today,
      challenges,
    };
  } catch {
    return defaults;
  }
}

function createInitialGameState(drafts: TrainerDraft[]): PersistedGameState {
  const starters = ['pikachu', 'charizard', 'blastoise', 'venusaur'];
  const pool = REGULAR_CARDS.map((c) => c.id);

  const trainers: Trainer[] = drafts.map((d, idx) => {
    const starter = starters[idx % starters.length];
    const extra1 = pool[(idx * 3 + 4) % pool.length];
    const extra2 = pool[(idx * 3 + 7) % pool.length];
    return {
      id: `trainer_${idx + 1}`,
      name: d.name,
      isBot: d.isBot,
      color: d.color,
      position: 0,
      money: 1500,
      cards: Array.from(new Set([starter, extra1, extra2])),
      legendaries: [],
      badges: [],
      inRocketHideout: false,
      battlesWon: 0,
      battlesPlayed: 0,
      tradesCompleted: 0,
      skipTurn: false,
    };
  });

  return {
    phase: 'PLAYING',
    turn: 1,
    currentTrainerIndex: 0,
    trainers,
    tileOwners: {},
    activeEvent: null,
    eventTurnsLeft: 0,
    vaultLegendaries: LEGENDARY_CARDS.map((l) => l.id),
    lastRoll: null,
    hasMovedThisTurn: false,
    logs: [
      {
        id: `log_start_${Date.now()}`,
        turn: 1,
        text: `Championship started with ${trainers.map((t) => t.name).join(', ')}!`,
        tone: 'info',
      },
    ],
    startedAtMs: Date.now(),
  };
}

function computeNetWorth(trainer: Trainer): number {
  const badgeAssetVal = trainer.badges.reduce((sum, tileId) => {
    return sum + (BOARD_TILES[tileId]?.price || 250);
  }, 0);
  const legVal = trainer.legendaries.length * 480;
  return trainer.money + badgeAssetVal + legVal;
}

export default function App() {
  const browserOnline = useOnlineStatus();
  const [manualOffline, setManualOffline] = useState(false);
  const isOffline = !browserOnline || manualOffline;

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem(LS_THEME_KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [muted, setMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('board');
  const [meta, setMeta] = useState<LocalMeta>(loadInitialMeta);

  const [gameState, setGameState] = useState<PersistedGameState | null>(null);
  const [hasLocalSave, setHasLocalSave] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(LS_SAVE_KEY));
    } catch {
      return false;
    }
  });

  const [activeBattle, setActiveBattle] = useState<ActiveBattle | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Firebase Auth & Cloud state
  const [user, setUser] = useState<User | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const toastTimerRef = useRef<number | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3400);
  }, []);

  const notifyUser = useCallback(
    (title: string, body: string) => {
      showToast(`${title}: ${body}`);
      if (
        meta.notificationsEnabled &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(title, { body, icon: '/pwa-192x192.png' });
        } catch {
          // Ignore notification errors in restricted iframes
        }
      }
    },
    [meta.notificationsEnabled, showToast]
  );

  // Sync Dark Mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem(LS_THEME_KEY, darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    soundFx.muted = muted;
  }, [muted]);

  // Persist local meta
  useEffect(() => {
    try {
      localStorage.setItem(LS_META_KEY, JSON.stringify(meta));
    } catch {
      // Ignore storage quota issues
    }
  }, [meta]);

  // Auto-save active game locally
  useEffect(() => {
    if (gameState && gameState.phase === 'PLAYING') {
      try {
        localStorage.setItem(LS_SAVE_KEY, JSON.stringify(gameState));
        setHasLocalSave(true);
      } catch {
        // Ignore storage errors
      }
    }
  }, [gameState]);

  // Firebase Auth listener & Cloud hydration
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser && !isOffline) {
        try {
          const profile = await loadUserProfile(nextUser.uid);
          if (profile) {
            setMeta((prev) => ({
              ...prev,
              pokedexCaught: Array.from(
                new Set([...prev.pokedexCaught, ...profile.pokedexCaught])
              ),
              totalWins: Math.max(prev.totalWins, profile.totalWins),
              totalGames: Math.max(prev.totalGames, profile.totalGames),
              totalBattlesWon: Math.max(prev.totalBattlesWon, profile.totalBattlesWon),
              totalBattlesPlayed: Math.max(prev.totalBattlesPlayed, profile.totalBattlesPlayed),
              dailyStreak: Math.max(prev.dailyStreak, profile.dailyStreak),
              notificationsEnabled: profile.notificationsEnabled,
            }));
          } else {
            await ensureUserProfile(nextUser, {
              displayName: nextUser.displayName || 'Trainer',
              pokedexCaught: meta.pokedexCaught,
              totalWins: meta.totalWins,
              totalGames: meta.totalGames,
              totalBattlesWon: meta.totalBattlesWon,
              totalBattlesPlayed: meta.totalBattlesPlayed,
              dailyStreak: meta.dailyStreak,
              notificationsEnabled: meta.notificationsEnabled,
            });
          }

          const cloudHistory = await loadMatchHistoryFromCloud(nextUser.uid);
          if (cloudHistory.length > 0) {
            setMeta((prev) => {
              const seen = new Set(cloudHistory.map((m) => m.id));
              const merged = [
                ...cloudHistory,
                ...prev.matchHistory.filter((m) => !seen.has(m.id)),
              ].slice(0, 30);
              return { ...prev, matchHistory: merged };
            });
          }
        } catch (err) {
          console.error('Cloud hydration warning:', err);
        }
      }
    });
    return () => unsubAuth();
  }, [isOffline]);

  // Subscribe to Global Leaderboard when authenticated & online
  useEffect(() => {
    if (!user || isOffline) return;
    const unsub = subscribeLeaderboard(
      (rows) => setLeaderboard(rows),
      (err) => console.error('Leaderboard listener error:', err)
    );
    return () => unsub();
  }, [user, isOffline]);

  // Helpers to update Pokedex & Daily Challenges
  const registerPokemon = useCallback((ids: string[], caught: boolean) => {
    setMeta((prev) => ({
      ...prev,
      pokedexSeen: Array.from(new Set([...prev.pokedexSeen, ...ids])),
      pokedexCaught: caught
        ? Array.from(new Set([...prev.pokedexCaught, ...ids]))
        : prev.pokedexCaught,
    }));
  }, []);

  const bumpChallengeProgress = useCallback(
    (metric: DailyChallenge['metric'], value: number, mode: 'add' | 'max' = 'add') => {
      setMeta((prev) => ({
        ...prev,
        challenges: prev.challenges.map((c) => {
          if (c.metric !== metric) return c;
          const nextVal = mode === 'add' ? c.progress + value : Math.max(c.progress, value);
          return { ...c, progress: nextVal };
        }),
      }));
    },
    []
  );

  // Trigger a random dynamic board event
  const triggerBoardEvent = useCallback(
    (state: PersistedGameState): PersistedGameState => {
      const ev = BOARD_EVENTS[Math.floor(Math.random() * BOARD_EVENTS.length)];
      soundFx.eventTrigger();
      notifyUser('Board Event', ev.title);

      const updatedTrainers = state.trainers.map((t) => {
        let nextMoney = t.money;
        if (ev.moneyDeltaAll) {
          nextMoney = Math.max(0, nextMoney + ev.moneyDeltaAll);
        }
        let nextCards = t.cards;
        if (ev.drawCard) {
          const randomCard = REGULAR_CARDS[Math.floor(Math.random() * REGULAR_CARDS.length)];
          nextCards = Array.from(new Set([...t.cards, randomCard.id]));
        }
        return { ...t, money: nextMoney, cards: nextCards };
      });

      const logEntry: GameLogEntry = {
        id: `log_ev_${Date.now()}`,
        turn: state.turn,
        text: `Event: ${ev.title} — ${ev.description}`,
        tone: 'event',
      };

      return {
        ...state,
        trainers: updatedTrainers,
        activeEvent: ev,
        eventTurnsLeft: ev.durationTurns,
        logs: [logEntry, ...state.logs].slice(0, 30),
      };
    },
    [notifyUser]
  );

  // Complete Match & Record Analytics
  const finishMatch = useCallback(
    async (finalState: PersistedGameState) => {
      const sorted = [...finalState.trainers].sort(
        (a, b) => computeNetWorth(b) - computeNetWorth(a)
      );
      const winner = sorted[0];
      const humanTrainer = finalState.trainers.find((t) => !t.isBot) || finalState.trainers[0];
      const didWin = winner.id === humanTrainer.id;
      const durationMinutes = Math.max(
        1,
        Math.round((Date.now() - finalState.startedAtMs) / 60000)
      );

      // Determine favorite type from human trainer's deck
      const firstCard = POKEMON_BY_ID[humanTrainer.cards[0]] || POKEMON_CARDS[0];
      const favType: ElementType = firstCard.type;

      const record: MatchAnalyticsRecord = {
        id: `match_${Date.now()}`,
        dateLabel: new Date().toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        winnerName: winner.name,
        didWin,
        badgesCollected: humanTrainer.badges.length,
        battlesWon: humanTrainer.battlesWon,
        battlesPlayed: humanTrainer.battlesPlayed,
        finalNetWorth: computeNetWorth(humanTrainer),
        favoriteType: favType,
        durationMinutes,
      };

      setGameState({ ...finalState, phase: 'GAME_OVER' });
      localStorage.removeItem(LS_SAVE_KEY);
      setHasLocalSave(false);

      setMeta((prev) => {
        const nextWins = prev.totalWins + (didWin ? 1 : 0);
        const nextGames = prev.totalGames + 1;
        const nextBattlesWon = prev.totalBattlesWon + humanTrainer.battlesWon;
        const nextBattlesPlayed = prev.totalBattlesPlayed + humanTrainer.battlesPlayed;
        return {
          ...prev,
          totalWins: nextWins,
          totalGames: nextGames,
          totalBattlesWon: nextBattlesWon,
          totalBattlesPlayed: nextBattlesPlayed,
          matchHistory: [record, ...prev.matchHistory].slice(0, 30),
        };
      });

      soundFx.badgeWin();
      showToast(`${winner.name} wins the PokéPoly Championship!`);

      if (user && !isOffline) {
        try {
          await recordMatchToCloud(user, record);
        } catch (err) {
          console.error('Failed to sync match record:', err);
        }
      }
    },
    [isOffline, showToast, user]
  );

  // Move active trainer by `steps`
  const executeMove = useCallback(
    (steps: number, dicePair: [number, number] | null) => {
      setGameState((prev) => {
        if (!prev || prev.phase !== 'PLAYING') return prev;
        const idx = prev.currentTrainerIndex;
        const trainer = prev.trainers[idx];
        const prevPos = trainer.position;
        const nextPos = (prevPos + steps) % BOARD_TILES.length;
        const passedGo = prevPos + steps >= BOARD_TILES.length;
        const tile = BOARD_TILES[nextPos];

        soundFx.step();

        let nextMoney = trainer.money + (passedGo ? 300 : 0);
        let nextCards = [...trainer.cards];
        const logs: GameLogEntry[] = [...prev.logs];

        if (passedGo) {
          logs.unshift({
            id: `log_go_${Date.now()}`,
            turn: prev.turn,
            text: `${trainer.name} passed Pallet Town and collected +300₽!`,
            tone: 'info',
          });
        }

        const updatedTrainer: Trainer = {
          ...trainer,
          position: nextPos,
          money: nextMoney,
          cards: nextCards,
        };

        let nextState: PersistedGameState = {
          ...prev,
          trainers: prev.trainers.map((t, i) => (i === idx ? updatedTrainer : t)),
          lastRoll: dicePair,
          hasMovedThisTurn: true,
          logs: [
            {
              id: `log_move_${Date.now()}`,
              turn: prev.turn,
              text: `${trainer.name} moved ${steps} spaces to ${tile.name}.`,
              tone: 'info' as const,
            },
            ...logs,
          ].slice(0, 30),
        };

        // Handle Tile Effects
        if (tile.kind === 'POKECENTER') {
          const bonusCard = REGULAR_CARDS[Math.floor(Math.random() * REGULAR_CARDS.length)];
          nextState.trainers[idx] = {
            ...nextState.trainers[idx],
            money: nextState.trainers[idx].money + 100,
            cards: Array.from(new Set([...nextState.trainers[idx].cards, bonusCard.id])),
          };
          registerPokemon([bonusCard.id], true);
          nextState.logs.unshift({
            id: `log_pc_${Date.now()}`,
            turn: prev.turn,
            text: `${trainer.name} rested at Pokémon Center (+100₽ & drew ${bonusCard.name}).`,
            tone: 'info',
          });
        } else if (tile.kind === 'PLATEAU') {
          nextState.trainers[idx] = {
            ...nextState.trainers[idx],
            money: nextState.trainers[idx].money + 150,
          };
          nextState.logs.unshift({
            id: `log_pl_${Date.now()}`,
            turn: prev.turn,
            text: `${trainer.name} received a +150₽ Indigo Plateau training bonus!`,
            tone: 'info',
          });
        } else if (tile.kind === 'ROCKET') {
          const fine = Math.min(nextState.trainers[idx].money, 150);
          nextState.trainers[idx] = {
            ...nextState.trainers[idx],
            money: nextState.trainers[idx].money - fine,
          };
          nextState.logs.unshift({
            id: `log_rk_${Date.now()}`,
            turn: prev.turn,
            text: `Team Rocket ambushed ${trainer.name} for -${fine}₽!`,
            tone: 'event',
          });
        } else if (tile.kind === 'MART') {
          const rareCard = REGULAR_CARDS[Math.floor(Math.random() * REGULAR_CARDS.length)];
          if (nextState.trainers[idx].money >= 120) {
            nextState.trainers[idx] = {
              ...nextState.trainers[idx],
              money: nextState.trainers[idx].money - 120,
              cards: Array.from(new Set([...nextState.trainers[idx].cards, rareCard.id])),
            };
            registerPokemon([rareCard.id], true);
            nextState.logs.unshift({
              id: `log_mt_${Date.now()}`,
              turn: prev.turn,
              text: `${trainer.name} bought a ${rareCard.name} Battle Card at Poké Mart (120₽).`,
              tone: 'info',
            });
          }
        } else if (tile.kind === 'EVENT') {
          nextState = triggerBoardEvent(nextState);
        } else if (tile.kind === 'SHRINE') {
          if (!trainer.isBot) {
            setShowTradeModal(true);
          } else if (
            nextState.vaultLegendaries.length > 0 &&
            nextState.trainers[idx].money >= 520
          ) {
            const legId = nextState.vaultLegendaries[0];
            nextState.trainers[idx] = {
              ...nextState.trainers[idx],
              money: nextState.trainers[idx].money - 480,
              legendaries: [...nextState.trainers[idx].legendaries, legId],
            };
            nextState.vaultLegendaries = nextState.vaultLegendaries.slice(1);
            nextState.logs.unshift({
              id: `log_sh_${Date.now()}`,
              turn: prev.turn,
              text: `${trainer.name} awakened Legendary ${POKEMON_BY_ID[legId]?.name} at Bell Shrine!`,
              tone: 'trade',
            });
          }
        } else if (tile.kind === 'BADGE' && tile.guardianCardId) {
          const ownerId = prev.tileOwners[tile.id];
          const rentMult = prev.activeEvent?.rentMultiplier || 1;
          const computedRent = Math.round((tile.rent || 120) * rentMult);

          if (!ownerId) {
            if (!trainer.isBot) {
              registerPokemon([tile.guardianCardId], false);
              setActiveBattle({
                tileId: tile.id,
                attackerId: trainer.id,
                defenderId: null,
                defenderCardId: tile.guardianCardId,
                stakeType: 'CLAIM_BADGE',
                costIfBought: tile.price || 300,
                rentPenalty: 0,
              });
            } else {
              // Bot automatically battles Gym Guardian
              const botCard =
                POKEMON_BY_ID[nextState.trainers[idx].cards[0]] || POKEMON_CARDS[0];
              const guard = POKEMON_BY_ID[tile.guardianCardId];
              const mult = getTypeMultiplier(botCard.type, guard.type);
              const won = botCard.atk * mult + Math.random() * 16 >= guard.atk + 6;
              const discountPrice = Math.round((tile.price || 300) * 0.5);
              if (won && nextState.trainers[idx].money >= discountPrice) {
                nextState.trainers[idx] = {
                  ...nextState.trainers[idx],
                  money: nextState.trainers[idx].money - discountPrice,
                  badges: [...nextState.trainers[idx].badges, tile.id],
                  battlesWon: nextState.trainers[idx].battlesWon + 1,
                  battlesPlayed: nextState.trainers[idx].battlesPlayed + 1,
                };
                nextState.tileOwners = { ...nextState.tileOwners, [tile.id]: trainer.id };
                nextState.logs.unshift({
                  id: `log_bb_${Date.now()}`,
                  turn: prev.turn,
                  text: `${trainer.name} defeated ${guard.name} and claimed ${tile.badgeName}!`,
                  tone: 'badge',
                });
              }
            }
          } else if (ownerId !== trainer.id) {
            const owner = prev.trainers.find((t) => t.id === ownerId)!;
            const ownerCardId =
              owner.legendaries[0] || owner.cards[0] || tile.guardianCardId;
            if (!trainer.isBot) {
              registerPokemon([ownerCardId], false);
              setActiveBattle({
                tileId: tile.id,
                attackerId: trainer.id,
                defenderId: owner.id,
                defenderCardId: ownerCardId,
                stakeType: 'SEIZE_BADGE',
                costIfBought: 0,
                rentPenalty: computedRent,
              });
            } else {
              // Bot pays rent to owner
              const paid = Math.min(nextState.trainers[idx].money, computedRent);
              nextState.trainers = nextState.trainers.map((t) => {
                if (t.id === trainer.id) return { ...t, money: t.money - paid };
                if (t.id === owner.id) return { ...t, money: t.money + paid };
                return t;
              });
              nextState.logs.unshift({
                id: `log_rent_${Date.now()}`,
                turn: prev.turn,
                text: `${trainer.name} paid ${paid}₽ Gym toll to ${owner.name} at ${tile.name}.`,
                tone: 'info',
              });
            }
          }
        }

        return nextState;
      });
    },
    [registerPokemon, triggerBoardEvent]
  );

  const handleRollAndMove = useCallback(() => {
    soundFx.diceRoll();
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    executeMove(d1 + d2, [d1, d2]);
  }, [executeMove]);

  const handleCardSprint = useCallback(() => {
    soundFx.diceRoll();
    executeMove(3, null);
  }, [executeMove]);

  const handleResolveBattle = useCallback(
    (result: { outcome: 'WIN' | 'LOSE' | 'BUY' | 'PAY_RENT'; usedCardId?: string }) => {
      if (!activeBattle) return;
      const battle = activeBattle;
      setActiveBattle(null);

      setGameState((prev) => {
        if (!prev) return prev;
        const tile = BOARD_TILES[battle.tileId];
        const attackerIdx = prev.trainers.findIndex((t) => t.id === battle.attackerId);
        if (attackerIdx === -1) return prev;
        const attacker = prev.trainers[attackerIdx];
        const logs = [...prev.logs];
        let nextOwners = { ...prev.tileOwners };
        const nextTrainers = [...prev.trainers];

        if (result.outcome === 'BUY') {
          const cost = battle.costIfBought;
          nextTrainers[attackerIdx] = {
            ...attacker,
            money: Math.max(0, attacker.money - cost),
            badges: Array.from(new Set([...attacker.badges, tile.id])),
          };
          nextOwners[tile.id] = attacker.id;
          soundFx.badgeWin();
          logs.unshift({
            id: `log_buy_${Date.now()}`,
            turn: prev.turn,
            text: `${attacker.name} purchased ${tile.badgeName} for ${cost}₽.`,
            tone: 'badge',
          });
          bumpChallengeProgress('badgesCollected', nextTrainers[attackerIdx].badges.length, 'max');
        } else if (result.outcome === 'PAY_RENT') {
          const paid = Math.min(attacker.money, battle.rentPenalty);
          nextTrainers[attackerIdx] = { ...attacker, money: attacker.money - paid };
          if (battle.defenderId) {
            const defIdx = nextTrainers.findIndex((t) => t.id === battle.defenderId);
            if (defIdx !== -1) {
              nextTrainers[defIdx] = {
                ...nextTrainers[defIdx],
                money: nextTrainers[defIdx].money + paid,
              };
            }
          }
          logs.unshift({
            id: `log_toll_${Date.now()}`,
            turn: prev.turn,
            text: `${attacker.name} paid ${paid}₽ Gym toll at ${tile.name}.`,
            tone: 'info',
          });
        } else if (result.outcome === 'WIN') {
          soundFx.badgeWin();
          const discountPrice =
            battle.stakeType === 'CLAIM_BADGE'
              ? Math.min(attacker.money, Math.round(battle.costIfBought * 0.5))
              : 0;
          nextTrainers[attackerIdx] = {
            ...attacker,
            money: attacker.money - discountPrice,
            badges: Array.from(new Set([...attacker.badges, tile.id])),
            cards: Array.from(new Set([...attacker.cards, battle.defenderCardId])),
            battlesWon: attacker.battlesWon + 1,
            battlesPlayed: attacker.battlesPlayed + 1,
          };

          // If seized from rival, remove badge from rival
          if (battle.defenderId) {
            const defIdx = nextTrainers.findIndex((t) => t.id === battle.defenderId);
            if (defIdx !== -1) {
              nextTrainers[defIdx] = {
                ...nextTrainers[defIdx],
                badges: nextTrainers[defIdx].badges.filter((b) => b !== tile.id),
              };
            }
          }

          nextOwners[tile.id] = attacker.id;
          registerPokemon([battle.defenderCardId], true);
          bumpChallengeProgress('battlesWon', 1, 'add');
          bumpChallengeProgress('badgesCollected', nextTrainers[attackerIdx].badges.length, 'max');
          bumpChallengeProgress('netWorth', computeNetWorth(nextTrainers[attackerIdx]), 'max');

          logs.unshift({
            id: `log_win_${Date.now()}`,
            turn: prev.turn,
            text: `${attacker.name} won the card duel and claimed ${tile.badgeName}!`,
            tone: 'battle',
          });
        } else {
          // LOSE
          soundFx.battleLose();
          const paid =
            battle.stakeType === 'SEIZE_BADGE'
              ? Math.min(attacker.money, battle.rentPenalty)
              : 0;
          nextTrainers[attackerIdx] = {
            ...attacker,
            money: attacker.money - paid,
            battlesPlayed: attacker.battlesPlayed + 1,
          };
          if (battle.defenderId && paid > 0) {
            const defIdx = nextTrainers.findIndex((t) => t.id === battle.defenderId);
            if (defIdx !== -1) {
              nextTrainers[defIdx] = {
                ...nextTrainers[defIdx],
                money: nextTrainers[defIdx].money + paid,
              };
            }
          }
          logs.unshift({
            id: `log_lose_${Date.now()}`,
            turn: prev.turn,
            text: `${attacker.name} lost the card duel at ${tile.name}${paid > 0 ? ` (-${paid}₽)` : ''}.`,
            tone: 'battle',
          });
        }

        const nextState: PersistedGameState = {
          ...prev,
          trainers: nextTrainers,
          tileOwners: nextOwners,
          logs: logs.slice(0, 30),
        };

        // Check Championship Victory (6 Badges!)
        if (nextTrainers[attackerIdx].badges.length >= 6) {
          setTimeout(() => finishMatch(nextState), 300);
        }

        return nextState;
      });
    },
    [activeBattle, bumpChallengeProgress, finishMatch, registerPokemon]
  );

  const handleEndTurn = useCallback(() => {
    setGameState((prev) => {
      if (!prev || prev.phase !== 'PLAYING') return prev;
      const nextIdx = (prev.currentTrainerIndex + 1) % prev.trainers.length;
      const nextTurn = nextIdx === 0 ? prev.turn + 1 : prev.turn;
      let eventTurnsLeft = prev.eventTurnsLeft;
      let activeEvent = prev.activeEvent;

      if (nextIdx === 0 && eventTurnsLeft > 0) {
        eventTurnsLeft -= 1;
        if (eventTurnsLeft === 0) activeEvent = null;
      }

      let nextState: PersistedGameState = {
        ...prev,
        turn: nextTurn,
        currentTrainerIndex: nextIdx,
        hasMovedThisTurn: false,
        lastRoll: null,
        activeEvent,
        eventTurnsLeft,
      };

      // Trigger a dynamic board event every 4 full rounds
      if (nextIdx === 0 && nextTurn % 4 === 0 && !activeEvent) {
        nextState = triggerBoardEvent(nextState);
      }

      return nextState;
    });
  }, [triggerBoardEvent]);

  // Automated Bot Turn Loop
  useEffect(() => {
    if (!gameState || gameState.phase !== 'PLAYING' || activeBattle || showTradeModal) {
      return;
    }
    const active = gameState.trainers[gameState.currentTrainerIndex];
    if (!active?.isBot) return;

    const timer = window.setTimeout(() => {
      if (!gameState.hasMovedThisTurn) {
        handleRollAndMove();
      } else {
        handleEndTurn();
      }
    }, 680);

    return () => window.clearTimeout(timer);
  }, [gameState, activeBattle, showTradeModal, handleRollAndMove, handleEndTurn]);

  // Legendary Vault Claim & Trainer Trade
  const handleClaimVault = useCallback(
    (legendaryId: string, price: number) => {
      setGameState((prev) => {
        if (!prev) return prev;
        const idx = prev.currentTrainerIndex;
        const trainer = prev.trainers[idx];
        if (trainer.money < price) return prev;
        const card = POKEMON_BY_ID[legendaryId];
        soundFx.tradeSuccess();
        registerPokemon([legendaryId], true);
        bumpChallengeProgress('tradesCompleted', 1, 'add');

        const nextTrainers = prev.trainers.map((t, i) =>
          i === idx
            ? {
                ...t,
                money: t.money - price,
                legendaries: Array.from(new Set([...t.legendaries, legendaryId])),
                tradesCompleted: t.tradesCompleted + 1,
              }
            : t
        );
        return {
          ...prev,
          trainers: nextTrainers,
          vaultLegendaries: prev.vaultLegendaries.filter((id) => id !== legendaryId),
          logs: [
            {
              id: `log_leg_${Date.now()}`,
              turn: prev.turn,
              text: `${trainer.name} claimed Legendary ${card?.name} from the Ancient Vault (${price}₽)!`,
              tone: 'trade' as const,
            },
            ...prev.logs,
          ].slice(0, 30),
        };
      });
    },
    [bumpChallengeProgress, registerPokemon]
  );

  const handleExecuteTrade = useCallback(
    (params: {
      partnerId: string;
      requestedLegendaryId: string;
      offeredMoney: number;
      offeredLegendaryId?: string;
    }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        const idx = prev.currentTrainerIndex;
        const me = prev.trainers[idx];
        const partnerIdx = prev.trainers.findIndex((t) => t.id === params.partnerId);
        if (partnerIdx === -1) return prev;
        const partner = prev.trainers[partnerIdx];

        soundFx.tradeSuccess();
        registerPokemon([params.requestedLegendaryId], true);
        bumpChallengeProgress('tradesCompleted', 1, 'add');

        const nextMe: Trainer = {
          ...me,
          money: me.money - params.offeredMoney,
          legendaries: [
            ...me.legendaries.filter((id) => id !== params.offeredLegendaryId),
            params.requestedLegendaryId,
          ],
          tradesCompleted: me.tradesCompleted + 1,
        };
        const nextPartner: Trainer = {
          ...partner,
          money: partner.money + params.offeredMoney,
          legendaries: [
            ...partner.legendaries.filter((id) => id !== params.requestedLegendaryId),
            ...(params.offeredLegendaryId ? [params.offeredLegendaryId] : []),
          ],
        };

        const nextTrainers = prev.trainers.map((t, i) =>
          i === idx ? nextMe : i === partnerIdx ? nextPartner : t
        );

        return {
          ...prev,
          trainers: nextTrainers,
          logs: [
            {
              id: `log_tr_${Date.now()}`,
              turn: prev.turn,
              text: `${me.name} traded ${params.offeredMoney}₽${
                params.offeredLegendaryId
                  ? ` + ${POKEMON_BY_ID[params.offeredLegendaryId]?.name}`
                  : ''
              } to ${partner.name} for Legendary ${
                POKEMON_BY_ID[params.requestedLegendaryId]?.name
              }!`,
              tone: 'trade' as const,
            },
            ...prev.logs,
          ].slice(0, 30),
        };
      });
    },
    [bumpChallengeProgress, registerPokemon]
  );

  // Claim Daily Challenge Reward
  const handleClaimChallenge = useCallback(
    (challengeId: string) => {
      const target = meta.challenges.find((c) => c.id === challengeId);
      if (!target || target.claimed || target.progress < target.target) return;

      soundFx.badgeWin();
      setMeta((prev) => ({
        ...prev,
        bonusXp: prev.bonusXp + target.rewardXp,
        challenges: prev.challenges.map((c) =>
          c.id === challengeId ? { ...c, claimed: true } : c
        ),
      }));

      // Also award cash into active game's human trainer!
      setGameState((prev) => {
        if (!prev || prev.phase !== 'PLAYING') return prev;
        const hIdx = prev.trainers.findIndex((t) => !t.isBot);
        if (hIdx === -1) return prev;
        const nextTrainers = prev.trainers.map((t, i) =>
          i === hIdx ? { ...t, money: t.money + target.rewardMoney } : t
        );
        return {
          ...prev,
          trainers: nextTrainers,
          logs: [
            {
              id: `log_ch_${Date.now()}`,
              turn: prev.turn,
              text: `Daily Challenge "${target.title}" claimed! +${target.rewardMoney}₽ & +${target.rewardXp} XP.`,
              tone: 'badge' as const,
            },
            ...prev.logs,
          ].slice(0, 30),
        };
      });
      showToast(`Claimed +${target.rewardMoney}₽ and +${target.rewardXp} XP!`);
    },
    [meta.challenges, showToast]
  );

  // Cloud Save & Cloud Load & Leaderboard Sync
  const handleCloudSave = useCallback(async () => {
    if (!user) {
      try {
        await signInWithGoogle();
        showToast('Signed in! Click Cloud Save again to upload your session.');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Sign-in cancelled.');
      }
      return;
    }
    if (isOffline) {
      showToast('Offline Mode active — game is saved locally on this device.');
      return;
    }
    setIsSyncing(true);
    try {
      await ensureUserProfile(user, {
        displayName: user.displayName || 'Trainer',
        pokedexCaught: meta.pokedexCaught,
        totalWins: meta.totalWins,
        totalGames: meta.totalGames,
        totalBattlesWon: meta.totalBattlesWon,
        totalBattlesPlayed: meta.totalBattlesPlayed,
        dailyStreak: meta.dailyStreak,
        notificationsEnabled: meta.notificationsEnabled,
      });
      if (gameState && gameState.phase === 'PLAYING') {
        await saveGameToCloud(user, 'slot_main', 'Latest Championship', gameState);
      }
      const winRate =
        meta.totalBattlesPlayed > 0
          ? Math.round((meta.totalBattlesWon / meta.totalBattlesPlayed) * 100)
          : 0;
      const score =
        meta.totalWins * 500 +
        meta.pokedexCaught.length * 60 +
        meta.totalBattlesWon * 75 +
        meta.bonusXp;
      await syncLeaderboardScore(user, {
        trainerName: user.displayName || 'Trainer',
        avatarColor: '#E11D48',
        score,
        wins: meta.totalWins,
        badgesCount: meta.matchHistory.reduce((acc, m) => acc + m.badgesCollected, 0),
        pokedexCount: meta.pokedexCaught.length,
        winRate,
        streak: meta.dailyStreak,
      });
      showToast('Cloud save & leaderboard standing synced!');
    } catch (err) {
      console.error(err);
      showToast('Cloud sync failed. Local save is intact.');
    } finally {
      setIsSyncing(false);
    }
  }, [gameState, isOffline, meta, showToast, user]);

  const handleLoadCloud = useCallback(async () => {
    if (!user || isOffline) return;
    setIsSyncing(true);
    try {
      const saved = await loadGameFromCloud(user.uid, 'slot_main');
      if (saved) {
        setGameState(saved);
        setActiveTab('board');
        showToast('Loaded saved match from Cloud!');
      } else {
        showToast('No cloud save found yet.');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not load cloud save.');
    } finally {
      setIsSyncing(false);
    }
  }, [isOffline, showToast, user]);

  const handleResumeLocal = useCallback(() => {
    try {
      const raw = localStorage.getItem(LS_SAVE_KEY);
      if (raw) {
        setGameState(JSON.parse(raw) as PersistedGameState);
        setActiveTab('board');
      }
    } catch {
      showToast('Could not read local save.');
    }
  }, [showToast]);

  const overallWinRate = useMemo(() => {
    if (meta.totalBattlesPlayed === 0) return 0;
    return Math.round((meta.totalBattlesWon / meta.totalBattlesPlayed) * 100);
  }, [meta.totalBattlesWon, meta.totalBattlesPlayed]);

  const totalBadgesHistorical = useMemo(
    () => meta.matchHistory.reduce((sum, m) => sum + m.badgesCollected, 0),
    [meta.matchHistory]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F5F2] dark:bg-[#0D111A] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Bar: Strict 3-Zone Contract */}
      <header className="sticky top-0 z-30 border-b-2 border-slate-900 dark:border-slate-700 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('board')}
            className="font-pixel text-base sm:text-lg text-rose-600 dark:text-rose-400 whitespace-nowrap shrink-0"
          >
            PokéPoly
          </button>

          {/* Zone 2: 5 clean single-line nav links */}
          <nav className="flex items-center gap-4 sm:gap-6 overflow-x-auto text-xs sm:text-sm font-semibold">
            {(
              [
                ['board', 'Board'],
                ['pokedex', 'Pokédex'],
                ['challenges', 'Challenges'],
                ['analytics', 'Analytics'],
                ['leaderboard', 'Leaderboard'],
              ] as [AppTab, string][]
            ).map(([tabKey, label]) => (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === tabKey
                    ? 'border-rose-600 text-slate-900 dark:text-white'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              disabled={isSyncing}
              onClick={handleCloudSave}
              className="pixel-btn inline-flex items-center gap-2 rounded bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white border-slate-900 hover:bg-rose-700 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {user ? <Cloud className="h-3.5 w-3.5" /> : <LogIn className="h-3.5 w-3.5" />}
              {user ? (isSyncing ? 'Syncing...' : 'Cloud Save') : 'Sign In'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-[1380px] flex-1 px-4 sm:px-6 py-5 space-y-5">
        {/* Workspace Utility Toolbar (below header) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-slate-200">
              {user ? user.displayName || 'Signed-In Trainer' : 'Guest Trainer'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">
              Pokédex {meta.pokedexCaught.length}/{POKEMON_CARDS.length}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">{meta.dailyStreak}d Streak</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PWAInstallButton />

            {user && !isOffline && (
              <button
                type="button"
                onClick={handleLoadCloud}
                className="inline-flex items-center gap-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <CloudDownload className="h-3.5 w-3.5" />
                Cloud Load
              </button>
            )}

            <button
              type="button"
              onClick={() => setManualOffline((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                manualOffline
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Plane className="h-3.5 w-3.5" />
              {manualOffline ? 'Travel Offline: On' : 'Travel Mode'}
            </button>

            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>

            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? 'Unmute 8-bit audio' : 'Mute 8-bit audio'}
              className="inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="inline-flex items-center gap-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              {darkMode ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5" />}
              {darkMode ? 'Light' : 'Dark'}
            </button>

            {user && (
              <button
                type="button"
                onClick={() => signOutUser().then(() => showToast('Signed out.'))}
                aria-label="Sign out"
                className="inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Active View */}
        {activeTab === 'board' && (
          <>
            {!gameState ? (
              <GameSetupView
                hasLocalSave={hasLocalSave}
                canLoadCloud={Boolean(user) && !isOffline}
                onStartNewGame={(drafts) => {
                  const next = createInitialGameState(drafts);
                  setGameState(next);
                  soundFx.badgeWin();
                }}
                onResumeLocal={handleResumeLocal}
                onLoadCloud={handleLoadCloud}
              />
            ) : gameState.phase === 'GAME_OVER' ? (
              <div className="pixel-panel mx-auto max-w-2xl rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600 p-6 text-center">
                <Trophy className="mx-auto h-10 w-10 text-amber-500" />
                <h2 className="mt-3 font-pixel text-xl text-slate-900 dark:text-white">
                  Championship Complete
                </h2>
                <div className="mt-5 space-y-2 text-left">
                  {[...gameState.trainers]
                    .sort((a, b) => computeNetWorth(b) - computeNetWorth(a))
                    .map((t, idx) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between rounded border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm"
                      >
                        <div className="font-semibold text-slate-900 dark:text-white">
                          #{idx + 1} {t.name}
                        </div>
                        <div className="font-mono-num text-xs text-slate-600 dark:text-slate-300">
                          {t.badges.length} Badges · {t.battlesWon} Battle Wins ·{' '}
                          <strong className="text-slate-900 dark:text-white">
                            {computeNetWorth(t).toLocaleString()}₽
                          </strong>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowShareModal(true)}
                    className="pixel-btn inline-flex items-center gap-2 rounded bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 border-slate-900"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share Milestone
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameState(null)}
                    className="pixel-btn rounded bg-rose-600 px-5 py-2 text-xs font-bold text-white border-slate-900 hover:bg-rose-700"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            ) : (
              <BoardView
                turn={gameState.turn}
                trainers={gameState.trainers}
                currentTrainerIndex={gameState.currentTrainerIndex}
                tileOwners={gameState.tileOwners}
                activeEvent={gameState.activeEvent}
                eventTurnsLeft={gameState.eventTurnsLeft}
                lastRoll={gameState.lastRoll}
                hasMovedThisTurn={gameState.hasMovedThisTurn}
                logs={gameState.logs}
                onRollAndMove={handleRollAndMove}
                onCardSprint={handleCardSprint}
                onEndTurn={handleEndTurn}
                onOpenTrade={() => setShowTradeModal(true)}
                onFinishGameEarly={() => finishMatch(gameState)}
              />
            )}
          </>
        )}

        {activeTab === 'pokedex' && (
          <PokedexView caughtIds={meta.pokedexCaught} seenIds={meta.pokedexSeen} />
        )}

        {activeTab === 'challenges' && (
          <DailyChallengesView
            challenges={meta.challenges}
            notificationsEnabled={meta.notificationsEnabled}
            onClaimReward={handleClaimChallenge}
            onToggleNotifications={async (enabled) => {
              setMeta((prev) => ({ ...prev, notificationsEnabled: enabled }));
            }}
            onSendTestNotification={() =>
              notifyUser(
                'PokéPoly Daily Reminder',
                'Your Daily Trainer Challenges and Zapdos Surge event are ready!'
              )
            }
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            history={meta.matchHistory}
            dailyStreak={meta.dailyStreak}
            pokedexCount={meta.pokedexCaught.length}
            pokedexTotal={POKEMON_CARDS.length}
            totalWins={meta.totalWins}
            totalBattlesWon={meta.totalBattlesWon}
            totalBattlesPlayed={meta.totalBattlesPlayed}
            onOpenShare={() => setShowShareModal(true)}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView
            rows={leaderboard}
            currentUserId={user?.uid || null}
            isOffline={isOffline}
            isSyncing={isSyncing}
            onSignIn={handleCloudSave}
            onSyncMyScore={handleCloudSave}
          />
        )}
      </main>

      {/* Modals */}
      {activeBattle && gameState && (
        <CardBattleModal
          battle={activeBattle}
          attacker={
            gameState.trainers.find((t) => t.id === activeBattle.attackerId) ||
            gameState.trainers[0]
          }
          defender={
            activeBattle.defenderId
              ? gameState.trainers.find((t) => t.id === activeBattle.defenderId) || null
              : null
          }
          activeEvent={gameState.activeEvent}
          onResolve={handleResolveBattle}
        />
      )}

      {showTradeModal && gameState && (
        <LegendaryTradeModal
          currentTrainer={gameState.trainers[gameState.currentTrainerIndex]}
          allTrainers={gameState.trainers}
          vaultLegendaries={gameState.vaultLegendaries}
          onClaimVault={handleClaimVault}
          onExecuteTrade={handleExecuteTrade}
          onClose={() => setShowTradeModal(false)}
        />
      )}

      {showShareModal && (
        <ShareMilestoneModal
          trainerName={
            user?.displayName ||
            gameState?.trainers[0]?.name ||
            'Champion Trainer'
          }
          wins={meta.totalWins}
          winRate={overallWinRate}
          badgesTotal={totalBadgesHistorical}
          pokedexCount={meta.pokedexCaught.length}
          pokedexTotal={POKEMON_CARDS.length}
          streak={meta.dailyStreak}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded border-2 border-slate-900 bg-slate-900 dark:bg-slate-100 px-4 py-2.5 text-xs font-semibold text-white dark:text-slate-900 shadow-lg">
          {toast}
        </div>
      )}

      <OfflineIndicator manualOffline={manualOffline} />
    </div>
  );
}
