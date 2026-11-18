import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type { LeaderboardRow, MatchAnalyticsRecord, PersistedGameState } from './types/game';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export interface CloudUserProfile {
  uid: string;
  displayName: string;
  avatarColor: string;
  totalWins: number;
  totalGames: number;
  totalBattlesWon: number;
  totalBattlesPlayed: number;
  pokedexCaught: string[];
  dailyStreak: number;
  lastPlayedDate: string;
  notificationsEnabled: boolean;
}

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120) || 'default';
}

export async function ensureUserProfile(
  user: User,
  partial: Partial<CloudUserProfile>
): Promise<void> {
  const uid = user.uid;
  const path = `users/${uid}`;
  const ref = doc(db, 'users', uid);
  try {
    const snap = await getDoc(ref);
    const today = new Date().toISOString().slice(0, 10);
    const displayName = (partial.displayName || user.displayName || 'Trainer').slice(0, 50);
    const avatarColor = (partial.avatarColor || '#E11D48').slice(0, 20);
    const caught = Array.from(new Set(partial.pokedexCaught || [])).slice(0, 40);

    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        displayName,
        avatarColor,
        totalWins: Math.max(0, partial.totalWins ?? 0),
        totalGames: Math.max(0, partial.totalGames ?? 0),
        totalBattlesWon: Math.max(0, partial.totalBattlesWon ?? 0),
        totalBattlesPlayed: Math.max(0, partial.totalBattlesPlayed ?? 0),
        pokedexCaught: caught,
        dailyStreak: Math.max(1, partial.dailyStreak ?? 1),
        lastPlayedDate: today,
        notificationsEnabled: Boolean(partial.notificationsEnabled),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const existingData = snap.data();
      const mergedCaught = Array.from(
        new Set([...(existingData.pokedexCaught || []), ...caught])
      ).slice(0, 40);
      await setDoc(
        ref,
        {
          uid,
          displayName,
          avatarColor,
          totalWins: Math.max(existingData.totalWins || 0, partial.totalWins ?? 0),
          totalGames: Math.max(existingData.totalGames || 0, partial.totalGames ?? 0),
          totalBattlesWon: Math.max(existingData.totalBattlesWon || 0, partial.totalBattlesWon ?? 0),
          totalBattlesPlayed: Math.max(
            existingData.totalBattlesPlayed || 0,
            partial.totalBattlesPlayed ?? 0
          ),
          pokedexCaught: mergedCaught,
          dailyStreak: Math.max(existingData.dailyStreak || 1, partial.dailyStreak ?? 1),
          lastPlayedDate: today,
          notificationsEnabled:
            partial.notificationsEnabled ?? Boolean(existingData.notificationsEnabled),
          createdAt: existingData.createdAt,
          updatedAt: serverTimestamp(),
        },
        { merge: false }
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadUserProfile(uid: string): Promise<CloudUserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      uid: d.uid,
      displayName: d.displayName,
      avatarColor: d.avatarColor,
      totalWins: d.totalWins,
      totalGames: d.totalGames,
      totalBattlesWon: d.totalBattlesWon,
      totalBattlesPlayed: d.totalBattlesPlayed,
      pokedexCaught: Array.isArray(d.pokedexCaught) ? d.pokedexCaught : [],
      dailyStreak: d.dailyStreak || 1,
      lastPlayedDate: d.lastPlayedDate || new Date().toISOString().slice(0, 10),
      notificationsEnabled: Boolean(d.notificationsEnabled),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveGameToCloud(
  user: User,
  slotId: string,
  slotName: string,
  state: PersistedGameState
): Promise<void> {
  const safeSlot = sanitizeId(slotId);
  const path = `users/${user.uid}/cloudSaves/${safeSlot}`;
  try {
    await ensureUserProfile(user, {});
    const ref = doc(db, 'users', user.uid, 'cloudSaves', safeSlot);
    const existing = await getDoc(ref);
    const activeTrainer = state.trainers[state.currentTrainerIndex];
    const activeRegion =
      activeTrainer && activeTrainer.position >= 15
        ? 'Sinnoh'
        : activeTrainer && activeTrainer.position >= 10
          ? 'Hoenn'
          : activeTrainer && activeTrainer.position >= 5
            ? 'Johto'
            : 'Kanto';

    const payload = {
      ownerId: user.uid,
      slotName: slotName.slice(0, 60) || 'Auto Save',
      turnNumber: Math.max(1, state.turn),
      playerCount: Math.min(4, Math.max(2, state.trainers.length)),
      activeRegion,
      statePayload: {
        phase: state.phase,
        turn: state.turn,
        currentTrainerIndex: state.currentTrainerIndex,
        trainers: state.trainers,
        tileOwners: state.tileOwners,
        activeEvent: state.activeEvent,
        eventTurnsLeft: state.eventTurnsLeft,
        vaultLegendaries: state.vaultLegendaries,
        lastRoll: state.lastRoll,
        hasMovedThisTurn: state.hasMovedThisTurn,
        logs: state.logs.slice(0, 25),
        startedAtMs: state.startedAtMs,
      },
      createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadGameFromCloud(
  uid: string,
  slotId: string
): Promise<PersistedGameState | null> {
  const safeSlot = sanitizeId(slotId);
  const path = `users/${uid}/cloudSaves/${safeSlot}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'cloudSaves', safeSlot));
    if (!snap.exists()) return null;
    const data = snap.data();
    return (data.statePayload as PersistedGameState) || null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function recordMatchToCloud(
  user: User,
  record: MatchAnalyticsRecord
): Promise<void> {
  const safeId = sanitizeId(record.id);
  const path = `users/${user.uid}/matchHistory/${safeId}`;
  try {
    await ensureUserProfile(user, {});
    await setDoc(doc(db, 'users', user.uid, 'matchHistory', safeId), {
      ownerId: user.uid,
      dateLabel: record.dateLabel.slice(0, 30),
      winnerName: record.winnerName.slice(0, 50),
      didWin: Boolean(record.didWin),
      badgesCollected: Math.min(32, Math.max(0, record.badgesCollected)),
      battlesWon: Math.min(500, Math.max(0, record.battlesWon)),
      battlesPlayed: Math.min(500, Math.max(0, record.battlesPlayed)),
      finalNetWorth: Math.min(10000000, Math.max(0, record.finalNetWorth)),
      favoriteType: record.favoriteType.slice(0, 20),
      durationMinutes: Math.min(1440, Math.max(0, record.durationMinutes)),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function loadMatchHistoryFromCloud(uid: string): Promise<MatchAnalyticsRecord[]> {
  const path = `users/${uid}/matchHistory`;
  try {
    const q = query(
      collection(db, 'users', uid, 'matchHistory'),
      where('ownerId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        dateLabel: data.dateLabel,
        winnerName: data.winnerName,
        didWin: Boolean(data.didWin),
        badgesCollected: Number(data.badgesCollected) || 0,
        battlesWon: Number(data.battlesWon) || 0,
        battlesPlayed: Number(data.battlesPlayed) || 0,
        finalNetWorth: Number(data.finalNetWorth) || 0,
        favoriteType: data.favoriteType || 'Fire',
        durationMinutes: Number(data.durationMinutes) || 10,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function syncLeaderboardScore(
  user: User,
  entry: Omit<LeaderboardRow, 'uid'>
): Promise<void> {
  const path = `leaderboard/${user.uid}`;
  try {
    const ref = doc(db, 'leaderboard', user.uid);
    const existing = await getDoc(ref);
    await setDoc(ref, {
      uid: user.uid,
      trainerName: (entry.trainerName || user.displayName || 'Trainer').slice(0, 50),
      avatarColor: (entry.avatarColor || '#E11D48').slice(0, 20),
      score: Math.min(10000000, Math.max(0, Math.round(entry.score))),
      wins: Math.min(100000, Math.max(0, Math.round(entry.wins))),
      badgesCount: Math.min(100000, Math.max(0, Math.round(entry.badgesCount))),
      pokedexCount: Math.min(40, Math.max(0, Math.round(entry.pokedexCount))),
      winRate: Math.min(100, Math.max(0, Math.round(entry.winRate))),
      streak: Math.min(10000, Math.max(0, Math.round(entry.streak))),
      createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeLeaderboard(
  onData: (rows: LeaderboardRow[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'leaderboard';
  const q = query(
    collection(db, path),
    where('score', '>=', 0),
    orderBy('score', 'desc'),
    limit(25)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const rows: LeaderboardRow[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          uid: data.uid || d.id,
          trainerName: data.trainerName || 'Trainer',
          avatarColor: data.avatarColor || '#E11D48',
          score: Number(data.score) || 0,
          wins: Number(data.wins) || 0,
          badgesCount: Number(data.badgesCount) || 0,
          pokedexCount: Number(data.pokedexCount) || 0,
          winRate: Number(data.winRate) || 0,
          streak: Number(data.streak) || 0,
        };
      });
      onData(rows);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
