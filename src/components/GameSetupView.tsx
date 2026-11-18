import React, { useState } from 'react';
import { Bot, CloudDownload, Play, RotateCcw, User } from 'lucide-react';
import { TRAINER_COLORS } from '../data/pokemonData';
import { PixelPokeball } from './PixelSprite';

export interface TrainerDraft {
  name: string;
  isBot: boolean;
  color: string;
}

interface GameSetupViewProps {
  hasLocalSave: boolean;
  canLoadCloud: boolean;
  onStartNewGame: (drafts: TrainerDraft[]) => void;
  onResumeLocal: () => void;
  onLoadCloud: () => void;
}

export const GameSetupView: React.FC<GameSetupViewProps> = ({
  hasLocalSave,
  canLoadCloud,
  onStartNewGame,
  onResumeLocal,
  onLoadCloud,
}) => {
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [drafts, setDrafts] = useState<TrainerDraft[]>([
    { name: 'Red', isBot: false, color: TRAINER_COLORS[0].hex },
    { name: 'Blue', isBot: true, color: TRAINER_COLORS[1].hex },
    { name: 'May', isBot: true, color: TRAINER_COLORS[2].hex },
    { name: 'Cynthia', isBot: true, color: TRAINER_COLORS[3].hex },
  ]);

  const activeDrafts = drafts.slice(0, playerCount);

  const updateDraft = (idx: number, patch: Partial<TrainerDraft>) => {
    setDrafts((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left: Retro Pixel Hero Art & Rules Overview */}
      <div className="lg:col-span-6 pixel-panel overflow-hidden rounded-lg bg-slate-900 border-slate-900 dark:border-slate-600 flex flex-col justify-between relative min-h-[380px]">
        <img
          src="/src/assets/images/pixel_board_center_1795016643288.jpg"
          alt="Retro 16-bit pixel art Pokemon regions continent"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover pixel-art opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/55 to-slate-950/35" />

        <div className="relative z-10 p-6">
          <div className="text-xs font-mono-num text-amber-300">
            Kanto · Johto · Hoenn · Sinnoh
          </div>
          <h1 className="mt-2 font-pixel text-2xl sm:text-3xl text-white leading-tight max-w-md [text-wrap:balance]">
            PokéPoly: Pixel League
          </h1>
          <p className="mt-3 text-sm text-slate-200 max-w-md leading-relaxed">
            Collect iconic Gym Badges as properties, battle Gym Guardians and rival trainers with Pokémon Battle Cards, trade Legendaries, and weather dynamic board events.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-3 p-6 pt-0 text-white">
          <div className="rounded border border-slate-400/30 bg-slate-950/75 p-3">
            <div className="font-pixel text-xs text-amber-300">CARD DUELS</div>
            <div className="mt-1 text-xs text-slate-300">
              Type-advantage clashes win territory
            </div>
          </div>
          <div className="rounded border border-slate-400/30 bg-slate-950/75 p-3">
            <div className="font-pixel text-xs text-emerald-300">4 TRAINERS</div>
            <div className="mt-1 text-xs text-slate-300">
              Local pass-and-play or CPU rivals
            </div>
          </div>
          <div className="rounded border border-slate-400/30 bg-slate-950/75 p-3">
            <div className="font-pixel text-xs text-sky-300">OFFLINE PWA</div>
            <div className="mt-1 text-xs text-slate-300">
              Play anywhere + Cloud Save sync
            </div>
          </div>
        </div>
      </div>

      {/* Right: Local Multiplayer Configuration */}
      <div className="lg:col-span-6 pixel-panel rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600 p-6 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-pixel text-base text-slate-900 dark:text-white">
                Match Setup
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure 2 to 4 local trainers on this device
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 p-1">
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setPlayerCount(count)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                    playerCount === count
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {count} Trainers
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {activeDrafts.map((draft, idx) => (
              <div
                key={idx}
                className="flex flex-wrap sm:flex-nowrap items-center gap-3 rounded border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3"
              >
                <PixelPokeball size={24} color={draft.color} />
                <input
                  type="text"
                  maxLength={20}
                  value={draft.name}
                  onChange={(e) => updateDraft(idx, { name: e.target.value })}
                  aria-label={`Trainer ${idx + 1} Name`}
                  className="min-w-0 flex-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm font-semibold text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => updateDraft(idx, { isBot: !draft.isBot })}
                  className={`inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    draft.isBot
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                      : 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {draft.isBot ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  {draft.isBot ? 'CPU Bot' : 'Human'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-5">
          <div className="flex flex-wrap items-center gap-2">
            {hasLocalSave && (
              <button
                type="button"
                onClick={onResumeLocal}
                className="pixel-btn inline-flex items-center gap-1.5 rounded bg-slate-100 dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white border-slate-900 dark:border-slate-500 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Resume Local Save
              </button>
            )}
            {canLoadCloud && (
              <button
                type="button"
                onClick={onLoadCloud}
                className="pixel-btn inline-flex items-center gap-1.5 rounded bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white border-slate-900 hover:bg-sky-700 whitespace-nowrap shrink-0"
              >
                <CloudDownload className="h-3.5 w-3.5" />
                Load Cloud Save
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              onStartNewGame(
                activeDrafts.map((d, i) => ({
                  ...d,
                  name: d.name.trim() || `Trainer ${i + 1}`,
                }))
              )
            }
            className="pixel-btn inline-flex items-center gap-2 rounded bg-rose-600 px-5 py-2.5 text-xs font-bold text-white border-slate-900 hover:bg-rose-700 whitespace-nowrap shrink-0"
          >
            <Play className="h-4 w-4" />
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};
