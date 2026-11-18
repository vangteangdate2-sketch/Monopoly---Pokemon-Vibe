import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Flame, Share2, Target } from 'lucide-react';
import type { ElementType, MatchAnalyticsRecord } from '../types/game';

interface AnalyticsViewProps {
  history: MatchAnalyticsRecord[];
  dailyStreak: number;
  pokedexCount: number;
  pokedexTotal: number;
  totalWins: number;
  totalBattlesWon: number;
  totalBattlesPlayed: number;
  onOpenShare: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  history,
  dailyStreak,
  pokedexCount,
  pokedexTotal,
  totalWins,
  totalBattlesWon,
  totalBattlesPlayed,
  onOpenShare,
}) => {
  const winRate =
    totalBattlesPlayed > 0
      ? Math.round((totalBattlesWon / totalBattlesPlayed) * 100)
      : 0;

  const avgNetWorth = useMemo(() => {
    if (history.length === 0) return 0;
    const sum = history.reduce((acc, m) => acc + m.finalNetWorth, 0);
    return Math.round(sum / history.length);
  }, [history]);

  const totalTrainingMinutes = useMemo(
    () => history.reduce((acc, m) => acc + m.durationMinutes, 0),
    [history]
  );

  const trendData = useMemo(() => {
    const ordered = [...history].reverse();
    return ordered.map((m, idx) => ({
      match: `M${idx + 1}`,
      date: m.dateLabel,
      netWorth: m.finalNetWorth,
      winPct:
        m.battlesPlayed > 0
          ? Math.round((m.battlesWon / m.battlesPlayed) * 100)
          : 0,
      badges: m.badgesCollected,
    }));
  }, [history]);

  const typeMasteryData = useMemo(() => {
    const counts: Record<ElementType, number> = {
      Fire: 0,
      Water: 0,
      Grass: 0,
      Electric: 0,
      Rock: 0,
      Psychic: 0,
      Dragon: 0,
      Ice: 0,
    };
    history.forEach((m) => {
      if (counts[m.favoriteType] !== undefined) {
        counts[m.favoriteType] += m.battlesWon + 1;
      }
    });
    return Object.entries(counts).map(([type, score]) => ({
      type,
      mastery: score,
    }));
  }, [history]);

  // Long-term milestone & fitness/consistency habit goals
  const weeklyMinutesGoal = 90;
  const streakGoal = 7;
  const pokedexGoalPct = Math.round((pokedexCount / pokedexTotal) * 100);
  const minutesPct = Math.min(100, Math.round((totalTrainingMinutes / weeklyMinutesGoal) * 100));
  const streakPct = Math.min(100, Math.round((dailyStreak / streakGoal) * 100));

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-pixel text-lg text-slate-900 dark:text-white">
            Trainer Performance Analytics
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Track battle win rates, net worth trajectory, elemental mastery, and long-term consistency goals.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenShare}
          className="pixel-btn inline-flex items-center gap-2 rounded bg-rose-600 px-4 py-2 text-xs font-semibold text-white border-slate-900 hover:bg-rose-700 whitespace-nowrap shrink-0 self-start"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share Milestone Card
        </button>
      </div>

      {/* 4 KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="pixel-panel rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Battle Win Rate</div>
          <div className="mt-1 font-mono-num text-2xl font-bold text-slate-900 dark:text-white">
            {winRate}%
          </div>
          <div className="mt-0.5 text-xs font-mono-num text-slate-500 dark:text-slate-400">
            {totalBattlesWon}W / {totalBattlesPlayed} Duels
          </div>
        </div>

        <div className="pixel-panel rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Avg. Match Net Worth</div>
          <div className="mt-1 font-mono-num text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {avgNetWorth.toLocaleString()}₽
          </div>
          <div className="mt-0.5 text-xs font-mono-num text-slate-500 dark:text-slate-400">
            Across {history.length} matches
          </div>
        </div>

        <div className="pixel-panel rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">League Championships</div>
          <div className="mt-1 font-mono-num text-2xl font-bold text-amber-600 dark:text-amber-400">
            {totalWins}
          </div>
          <div className="mt-0.5 text-xs font-mono-num text-slate-500 dark:text-slate-400">
            Pokédex {pokedexCount}/{pokedexTotal}
          </div>
        </div>

        <div className="pixel-panel rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Daily Training Streak</div>
          <div className="mt-1 font-mono-num text-2xl font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <Flame className="h-5 w-5" />
            {dailyStreak}d
          </div>
          <div className="mt-0.5 text-xs font-mono-num text-slate-500 dark:text-slate-400">
            {totalTrainingMinutes} min logged
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 pixel-panel rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600 p-5">
          <h3 className="font-pixel text-xs text-slate-900 dark:text-white mb-1">
            NET WORTH PROGRESSION (₽)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Match-over-match financial and badge asset growth
          </p>
          <div className="h-64 w-full">
            {trendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Complete a match to chart your net worth progression.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.25} />
                  <XAxis dataKey="match" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="netWorth"
                    name="Net Worth (₽)"
                    stroke="#E11D48"
                    fill="#E11D48"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 pixel-panel rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600 p-5">
          <h3 className="font-pixel text-xs text-slate-900 dark:text-white mb-1">
            ELEMENTAL TYPE MASTERY
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Winning battle affinity by Pokémon type
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeMasteryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.25} />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="mastery" name="Mastery Points" fill="#2563EB" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Long-Term Goals & Consistency Motivation Tracker */}
      <div className="pixel-panel rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-rose-600" />
          <h3 className="font-pixel text-xs text-slate-900 dark:text-white">
            LONG-TERM TRAINING & CONSISTENCY GOALS
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <span>7-Day Active Streak Goal</span>
              <span className="font-mono-num">{dailyStreak}/{streakGoal} days</span>
            </div>
            <div className="h-2.5 w-full rounded bg-slate-100 dark:bg-slate-800 border border-slate-900/40 dark:border-slate-700 overflow-hidden">
              <div className="h-full bg-rose-600" style={{ width: `${streakPct}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <span>Weekly Strategy Session Target</span>
              <span className="font-mono-num">{totalTrainingMinutes}/{weeklyMinutesGoal} min</span>
            </div>
            <div className="h-2.5 w-full rounded bg-slate-100 dark:bg-slate-800 border border-slate-900/40 dark:border-slate-700 overflow-hidden">
              <div className="h-full bg-emerald-600" style={{ width: `${minutesPct}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <span>Master Pokédex Completion</span>
              <span className="font-mono-num">{pokedexGoalPct}%</span>
            </div>
            <div className="h-2.5 w-full rounded bg-slate-100 dark:bg-slate-800 border border-slate-900/40 dark:border-slate-700 overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: `${pokedexGoalPct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
