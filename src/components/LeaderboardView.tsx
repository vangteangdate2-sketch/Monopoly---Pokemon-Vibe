import React from 'react';
import { CloudUpload, LogIn, Trophy } from 'lucide-react';
import type { LeaderboardRow } from '../types/game';
import { PixelPokeball } from './PixelSprite';

interface LeaderboardViewProps {
  rows: LeaderboardRow[];
  currentUserId: string | null;
  isOffline: boolean;
  isSyncing: boolean;
  onSignIn: () => void;
  onSyncMyScore: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  rows,
  currentUserId,
  isOffline,
  isSyncing,
  onSignIn,
  onSyncMyScore,
}) => {
  return (
    <div className="space-y-6">
      <div className="pixel-panel rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-pixel text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Global Trainer Leaderboard
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Compete worldwide on Championship Score, Gym Badges collected, Battle Win Rate, and Pokédex completion.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!currentUserId ? (
            <button
              type="button"
              disabled={isOffline}
              onClick={onSignIn}
              className="pixel-btn inline-flex items-center gap-2 rounded bg-rose-600 px-4 py-2 text-xs font-semibold text-white border-slate-900 hover:bg-rose-700 disabled:opacity-45 whitespace-nowrap shrink-0"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In to Compete
            </button>
          ) : (
            <button
              type="button"
              disabled={isOffline || isSyncing}
              onClick={onSyncMyScore}
              className="pixel-btn inline-flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-xs font-semibold text-white border-slate-900 hover:bg-emerald-700 disabled:opacity-45 whitespace-nowrap shrink-0"
            >
              <CloudUpload className="h-3.5 w-3.5" />
              {isSyncing ? 'Syncing...' : 'Sync My Standing'}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="pixel-panel overflow-hidden rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600">
        {!currentUserId && rows.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Sign in with Google to load live global rankings and publish your trainer score.
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              No trainers on the global board yet. Click <strong>Sync My Standing</strong> to claim Rank #1!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Trainer</th>
                  <th className="py-3 px-4 text-right">Score</th>
                  <th className="py-3 px-4 text-right">Wins</th>
                  <th className="py-3 px-4 text-right">Badges</th>
                  <th className="py-3 px-4 text-right">Pokédex</th>
                  <th className="py-3 px-4 text-right">Win %</th>
                  <th className="py-3 px-4 text-right">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {rows.map((row, idx) => {
                  const isMe = row.uid === currentUserId;
                  return (
                    <tr
                      key={row.uid}
                      className={
                        isMe
                          ? 'bg-rose-50/70 dark:bg-rose-950/30 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }
                    >
                      <td className="py-3 px-4 font-mono-num text-xs font-bold text-slate-700 dark:text-slate-300">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <PixelPokeball size={18} color={row.avatarColor} />
                          <span className="text-slate-900 dark:text-white">
                            {row.trainerName}
                            {isMe ? ' (You)' : ''}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num font-bold text-slate-900 dark:text-white">
                        {row.score.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num text-slate-700 dark:text-slate-300">
                        {row.wins}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num text-slate-700 dark:text-slate-300">
                        {row.badgesCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num text-slate-700 dark:text-slate-300">
                        {row.pokedexCount}/24
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num text-emerald-700 dark:text-emerald-400">
                        {row.winRate}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num text-amber-600 dark:text-amber-400">
                        {row.streak}d
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
