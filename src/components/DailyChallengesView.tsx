import React, { useState } from 'react';
import { Bell, BellRing, CheckCircle2, Gift } from 'lucide-react';
import type { DailyChallenge } from '../types/game';

interface DailyChallengesViewProps {
  challenges: DailyChallenge[];
  notificationsEnabled: boolean;
  onClaimReward: (challengeId: string) => void;
  onToggleNotifications: (enabled: boolean) => Promise<void>;
  onSendTestNotification: () => void;
}

export const DailyChallengesView: React.FC<DailyChallengesViewProps> = ({
  challenges,
  notificationsEnabled,
  onClaimReward,
  onToggleNotifications,
  onSendTestNotification,
}) => {
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);
  const completedCount = challenges.filter((c) => c.progress >= c.target).length;

  const handleNotifClick = async () => {
    setNotifFeedback(null);
    if (!notificationsEnabled) {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        setNotifFeedback('Browser notifications are not supported on this device. In-app event alerts remain active.');
        await onToggleNotifications(true);
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        await onToggleNotifications(true);
        setNotifFeedback('Push reminders enabled for daily challenges and special board events.');
      } else {
        setNotifFeedback('Notification permission was declined by browser. In-app reminders enabled instead.');
        await onToggleNotifications(true);
      }
    } else {
      await onToggleNotifications(false);
      setNotifFeedback('Reminders paused.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Push Notification Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 pixel-panel rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600 p-5">
          <h2 className="font-pixel text-lg text-slate-900 dark:text-white">
            Daily Trainer Challenges
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
            Complete rotating daily goals to earn bonus PokéDollars for your active match and Championship XP for the Global Leaderboard.
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 font-mono-num">
            <span>Completed Today: {completedCount}/{challenges.length}</span>
            <span aria-hidden="true">·</span>
            <span>Resets Daily at Midnight</span>
          </div>
        </div>

        <div className="lg:col-span-5 pixel-panel rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-pixel text-xs text-slate-900 dark:text-white">
                PUSH NOTIFICATIONS
              </h3>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {notificationsEnabled ? 'Active' : 'Off'}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Get alerted when new Daily Challenges unlock or Legendary Vault events begin.
            </p>
            {notifFeedback && (
              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
                {notifFeedback}
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleNotifClick}
              className={`pixel-btn inline-flex items-center gap-1.5 rounded px-3.5 py-2 text-xs font-semibold border-slate-900 whitespace-nowrap shrink-0 ${
                notificationsEnabled
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'bg-rose-600 text-white hover:bg-rose-700'
              }`}
            >
              {notificationsEnabled ? (
                <BellRing className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Bell className="h-3.5 w-3.5" />
              )}
              {notificationsEnabled ? 'Disable Alerts' : 'Enable Push Alerts'}
            </button>

            <button
              type="button"
              onClick={onSendTestNotification}
              className="pixel-btn rounded bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950 border-slate-900 hover:bg-amber-400 whitespace-nowrap shrink-0"
            >
              Send Test Reminder
            </button>
          </div>
        </div>
      </div>

      {/* Challenge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challenges.map((ch) => {
          const pct = Math.min(100, Math.round((ch.progress / ch.target) * 100));
          const isReady = ch.progress >= ch.target && !ch.claimed;
          return (
            <div
              key={ch.id}
              className="pixel-panel rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600 p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-pixel text-sm text-slate-900 dark:text-white">
                      {ch.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {ch.description}
                    </p>
                  </div>
                  <div className="text-right font-mono-num text-xs shrink-0">
                    <div className="font-bold text-amber-600 dark:text-amber-400">
                      +{ch.rewardMoney}₽
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">+{ch.rewardXp} XP</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-mono-num text-slate-600 dark:text-slate-300 mb-1.5">
                    <span>Progress</span>
                    <span>
                      {Math.min(ch.progress, ch.target)} / {ch.target} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded border border-slate-900/50 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        ch.claimed ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                {ch.claimed ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Reward Claimed
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={!isReady}
                    onClick={() => onClaimReward(ch.id)}
                    className="pixel-btn inline-flex items-center gap-1.5 rounded bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white border-slate-900 hover:bg-emerald-700 disabled:opacity-40 whitespace-nowrap shrink-0"
                  >
                    <Gift className="h-3.5 w-3.5" />
                    {isReady ? 'Claim Reward' : 'In Progress'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
