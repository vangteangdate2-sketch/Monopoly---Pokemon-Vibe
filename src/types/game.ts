export type Region = 'Kanto' | 'Johto' | 'Hoenn' | 'Sinnoh';

export type ElementType =
  | 'Fire'
  | 'Water'
  | 'Grass'
  | 'Electric'
  | 'Rock'
  | 'Psychic'
  | 'Dragon'
  | 'Ice';

export interface PokemonCard {
  id: string;
  dexNumber: number;
  name: string;
  type: ElementType;
  region: Region;
  atk: number;
  def: number;
  moveName: string;
  isLegendary: boolean;
  spriteKey: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
}

export type TileKind =
  | 'GO'
  | 'BADGE'
  | 'EVENT'
  | 'SHRINE'
  | 'POKECENTER'
  | 'ROCKET'
  | 'PLATEAU'
  | 'MART';

export interface BoardTile {
  id: number;
  name: string;
  subtitle: string;
  kind: TileKind;
  region?: Region;
  badgeName?: string;
  element?: ElementType;
  price?: number;
  rent?: number;
  guardianCardId?: string;
  gridRow: number; // 0..5
  gridCol: number; // 0..5
}

export interface Trainer {
  id: string;
  name: string;
  isBot: boolean;
  color: string;
  position: number;
  money: number;
  cards: string[]; // PokemonCard ids in hand
  legendaries: string[]; // Legendary PokemonCard ids owned
  badges: number[]; // BoardTile ids owned
  inRocketHideout: boolean;
  battlesWon: number;
  battlesPlayed: number;
  tradesCompleted: number;
  skipTurn: boolean;
}

export interface BoardEvent {
  id: string;
  title: string;
  description: string;
  boostedType?: ElementType;
  atkBonus?: number;
  rentMultiplier?: number;
  moneyDeltaAll?: number;
  drawCard?: boolean;
  durationTurns: number;
}

export interface ActiveBattle {
  tileId: number;
  attackerId: string;
  defenderId: string | null; // null = Gym Guardian
  defenderCardId: string;
  stakeType: 'CLAIM_BADGE' | 'SEIZE_BADGE';
  costIfBought: number;
  rentPenalty: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  rewardMoney: number;
  rewardXp: number;
  claimed: boolean;
  metric: 'battlesWon' | 'badgesCollected' | 'tradesCompleted' | 'netWorth' | 'cardsDrawn';
}

export interface MatchAnalyticsRecord {
  id: string;
  dateLabel: string;
  winnerName: string;
  didWin: boolean;
  badgesCollected: number;
  battlesWon: number;
  battlesPlayed: number;
  finalNetWorth: number;
  favoriteType: ElementType;
  durationMinutes: number;
}

export interface LeaderboardRow {
  uid: string;
  trainerName: string;
  avatarColor: string;
  score: number;
  wins: number;
  badgesCount: number;
  pokedexCount: number;
  winRate: number;
  streak: number;
}

export interface GameLogEntry {
  id: string;
  turn: number;
  text: string;
  tone: 'info' | 'battle' | 'event' | 'trade' | 'badge';
}

export type AppTab = 'board' | 'pokedex' | 'challenges' | 'analytics' | 'leaderboard';

export type GamePhase = 'SETUP' | 'PLAYING' | 'GAME_OVER';

export interface PersistedGameState {
  phase: GamePhase;
  turn: number;
  currentTrainerIndex: number;
  trainers: Trainer[];
  tileOwners: Record<number, string>; // tileId -> trainerId
  activeEvent: BoardEvent | null;
  eventTurnsLeft: number;
  vaultLegendaries: string[]; // Legendary IDs available in the Legendary Vault
  lastRoll: [number, number] | null;
  hasMovedThisTurn: boolean;
  logs: GameLogEntry[];
  startedAtMs: number;
}
