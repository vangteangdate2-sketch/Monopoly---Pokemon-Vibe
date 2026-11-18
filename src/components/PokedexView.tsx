import React, { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { ELEMENT_COLORS, POKEMON_CARDS, REGION_ACCENTS } from '../data/pokemonData';
import type { Region } from '../types/game';
import { PixelPokemonSprite } from './PixelSprite';

interface PokedexViewProps {
  caughtIds: string[];
  seenIds: string[];
}

export const PokedexView: React.FC<PokedexViewProps> = ({ caughtIds, seenIds }) => {
  const [filter, setFilter] = useState<'All' | Region | 'Legendary'>('All');
  const caughtSet = useMemo(() => new Set(caughtIds), [caughtIds]);
  const seenSet = useMemo(() => new Set([...seenIds, ...caughtIds]), [seenIds, caughtIds]);

  const filtered = useMemo(() => {
    if (filter === 'All') return POKEMON_CARDS;
    if (filter === 'Legendary') return POKEMON_CARDS.filter((p) => p.isLegendary);
    return POKEMON_CARDS.filter((p) => p.region === filter);
  }, [filter]);

  const completionPct = Math.round((caughtSet.size / POKEMON_CARDS.length) * 100);
  const legendaryCaught = POKEMON_CARDS.filter(
    (p) => p.isLegendary && caughtSet.has(p.id)
  ).length;
  const legendaryTotal = POKEMON_CARDS.filter((p) => p.isLegendary).length;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="pixel-panel rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-pixel text-lg text-slate-900 dark:text-white">
              Digital Pokédex
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Win Gym Card Battles, claim Ancient Vault Legendaries, and complete trades to register every species.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-5 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-3 md:pt-0 md:pl-6">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Caught</div>
              <div className="font-mono-num text-xl font-bold text-slate-900 dark:text-white">
                {caughtSet.size}/{POKEMON_CARDS.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Legendaries</div>
              <div className="font-mono-num text-xl font-bold text-amber-600 dark:text-amber-400">
                {legendaryCaught}/{legendaryTotal}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Completion</div>
              <div className="font-mono-num text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {completionPct}%
              </div>
            </div>
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div className="mt-4 h-3 w-full overflow-hidden rounded border border-slate-900/60 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-rose-600 transition-all duration-300"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Region Filter Segmented Control */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-200/70 dark:bg-slate-800/80 p-1 w-fit">
        {(['All', 'Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Legendary'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              filter === tab
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Pokemon Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((card) => {
          const isCaught = caughtSet.has(card.id);
          const isSeen = seenSet.has(card.id);
          const el = ELEMENT_COLORS[card.type];
          return (
            <div
              key={card.id}
              className={`pixel-panel rounded-lg border-slate-900 dark:border-slate-600 p-4 transition-colors ${
                isCaught
                  ? 'bg-white dark:bg-slate-900'
                  : 'bg-slate-100/80 dark:bg-slate-900/50 opacity-85'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs font-mono-num text-slate-500 dark:text-slate-400">
                  #{String(card.dexNumber).padStart(3, '0')} · {card.region}
                </div>
                <span
                  className="h-2.5 w-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: REGION_ACCENTS[card.region] }}
                  title={card.region}
                />
              </div>

              <div className="mt-3 flex items-center gap-3.5">
                <div
                  className={`rounded border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 ${
                    !isCaught && !isSeen ? 'grayscale opacity-50' : ''
                  }`}
                >
                  <PixelPokemonSprite
                    primaryColor={card.primaryColor}
                    secondaryColor={card.secondaryColor}
                    type={card.type}
                    isLegendary={card.isLegendary}
                    size={48}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-pixel text-xs text-slate-900 dark:text-white truncate">
                      {card.name}
                    </h3>
                    {card.isLegendary && (
                      <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <div className={`text-xs font-semibold mt-0.5 ${el.text}`}>
                    {card.type} · {card.moveName}
                  </div>
                  <div className="text-xs font-mono-num text-slate-600 dark:text-slate-300 mt-1">
                    ATK {card.atk} · DEF {card.def}
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                {card.description}
              </p>

              <div className="mt-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2.5 text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {isCaught ? 'Caught' : isSeen ? 'Seen in Battle' : 'Undiscovered'}
                </span>
                <span className="font-mono-num text-slate-500 dark:text-slate-400">
                  {card.isLegendary ? 'Legendary' : 'Regional'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
