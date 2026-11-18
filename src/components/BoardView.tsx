import React, { useState } from 'react';
import { ArrowLeftRight, Dice5, Flame, Sparkles, Swords } from 'lucide-react';
import {
  BOARD_TILES,
  ELEMENT_COLORS,
  POKEMON_BY_ID,
  REGION_ACCENTS,
} from '../data/pokemonData';
import type { BoardEvent, BoardTile, GameLogEntry, Trainer } from '../types/game';
import { PixelBadgeIcon, PixelPokeball, PixelPokemonSprite } from './PixelSprite';

interface BoardViewProps {
  turn: number;
  trainers: Trainer[];
  currentTrainerIndex: number;
  tileOwners: Record<number, string>;
  activeEvent: BoardEvent | null;
  eventTurnsLeft: number;
  lastRoll: [number, number] | null;
  hasMovedThisTurn: boolean;
  logs: GameLogEntry[];
  onRollAndMove: () => void;
  onCardSprint: () => void;
  onEndTurn: () => void;
  onOpenTrade: () => void;
  onFinishGameEarly: () => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  turn,
  trainers,
  currentTrainerIndex,
  tileOwners,
  activeEvent,
  eventTurnsLeft,
  lastRoll,
  hasMovedThisTurn,
  logs,
  onRollAndMove,
  onCardSprint,
  onEndTurn,
  onOpenTrade,
  onFinishGameEarly,
}) => {
  const [selectedTileId, setSelectedTileId] = useState<number>(1);
  const currentTrainer = trainers[currentTrainerIndex];
  const inspectedTile: BoardTile = BOARD_TILES[selectedTileId] || BOARD_TILES[0];
  const inspectedOwner = tileOwners[inspectedTile.id]
    ? trainers.find((t) => t.id === tileOwners[inspectedTile.id])
    : null;
  const guardianCard = inspectedTile.guardianCardId
    ? POKEMON_BY_ID[inspectedTile.guardianCardId]
    : null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Left / Main: 6x6 Retro Pixel Monopoly Board */}
      <div className="xl:col-span-8">
        <div className="pixel-panel rounded-lg bg-[#E6ECE5] dark:bg-[#141B29] border-slate-900 dark:border-slate-600 p-2.5 sm:p-3">
          <div className="grid grid-cols-6 grid-rows-6 gap-1.5 sm:gap-2 aspect-square w-full">
            {/* Center 4x4 Courtyard */}
            <div
              className="col-start-2 col-span-4 row-start-2 row-span-4 relative overflow-hidden rounded border-2 border-slate-900 dark:border-slate-600 bg-slate-900 flex flex-col justify-between p-3 sm:p-4"
            >
              <img
                src="/src/assets/images/pixel_board_center_1795016643288.jpg"
                alt="Retro pixel art regional stadium continent map"
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover pixel-art opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/92 via-slate-950/45 to-slate-950/75" />

              {/* Top: Active Event & Turn */}
              <div className="relative z-10 flex items-start justify-between gap-2">
                <div>
                  <div className="font-pixel text-[11px] sm:text-xs text-amber-300">
                    TURN {turn} · {currentTrainer.name.toUpperCase()}
                  </div>
                  <div className="text-[11px] text-slate-200 mt-0.5">
                    {currentTrainer.isBot ? 'Bot Trainer thinking...' : 'Your turn to advance & duel'}
                  </div>
                </div>
                {lastRoll && (
                  <div className="rounded border-2 border-amber-400/70 bg-slate-950/85 px-2.5 py-1 font-mono-num text-xs font-bold text-amber-300">
                    {lastRoll[0]} + {lastRoll[1]} = {lastRoll[0] + lastRoll[1]}
                  </div>
                )}
              </div>

              {/* Middle: Dynamic Board Event Banner */}
              <div className="relative z-10 my-auto">
                {activeEvent ? (
                  <div className="rounded border-2 border-amber-400/80 bg-slate-950/85 px-3 py-2 text-white">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-pixel text-[10px] sm:text-xs text-amber-300 flex items-center gap-1.5">
                        <Flame className="h-3.5 w-3.5 shrink-0" />
                        {activeEvent.title}
                      </span>
                      <span className="font-mono-num text-[10px] text-slate-300">
                        {eventTurnsLeft}t left
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-200 leading-snug">
                      {activeEvent.description}
                    </p>
                  </div>
                ) : (
                  <div className="rounded border border-slate-400/30 bg-slate-950/70 px-3 py-2 text-center">
                    <div className="font-pixel text-xs text-white">POKÉPOLY LEAGUE</div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      Kanto · Johto · Hoenn · Sinnoh
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom: Primary Turn Controls */}
              <div className="relative z-10 flex flex-wrap items-center justify-center gap-2">
                {!hasMovedThisTurn ? (
                  <>
                    <button
                      type="button"
                      disabled={currentTrainer.isBot}
                      onClick={onRollAndMove}
                      className="pixel-btn inline-flex items-center gap-1.5 rounded bg-rose-600 px-3.5 py-2 text-xs font-bold text-white border-slate-950 hover:bg-rose-500 disabled:opacity-50 whitespace-nowrap shrink-0"
                    >
                      <Dice5 className="h-4 w-4" />
                      Roll Dice
                    </button>
                    <button
                      type="button"
                      disabled={currentTrainer.isBot || currentTrainer.cards.length === 0}
                      onClick={onCardSprint}
                      title="Use top card speed to advance 3 spaces reliably"
                      className="pixel-btn inline-flex items-center gap-1.5 rounded bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 border-slate-950 hover:bg-amber-400 disabled:opacity-50 whitespace-nowrap shrink-0"
                    >
                      <Swords className="h-3.5 w-3.5" />
                      Card Sprint (+3)
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={currentTrainer.isBot}
                    onClick={onEndTurn}
                    className="pixel-btn inline-flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-2 text-xs font-bold text-white border-slate-950 hover:bg-emerald-500 disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    End Turn
                  </button>
                )}

                <button
                  type="button"
                  disabled={currentTrainer.isBot}
                  onClick={onOpenTrade}
                  className="pixel-btn inline-flex items-center gap-1.5 rounded bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white border-slate-950 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  Legendary Trade
                </button>
              </div>
            </div>

            {/* Perimeter 20 Tiles */}
            {BOARD_TILES.map((tile) => {
              const ownerId = tileOwners[tile.id];
              const owner = ownerId ? trainers.find((t) => t.id === ownerId) : null;
              const trainersHere = trainers.filter((t) => t.position === tile.id);
              const isSelected = selectedTileId === tile.id;
              const regionColor = tile.region ? REGION_ACCENTS[tile.region] : '#475569';

              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => setSelectedTileId(tile.id)}
                  style={{
                    gridRowStart: tile.gridRow + 1,
                    gridColumnStart: tile.gridCol + 1,
                  }}
                  className={`relative flex flex-col justify-between overflow-hidden rounded border-2 p-1.5 text-left transition-transform ${
                    isSelected
                      ? 'border-rose-600 ring-2 ring-rose-500/40 z-10'
                      : 'border-slate-900/80 dark:border-slate-600'
                  } bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800`}
                >
                  {/* Region Top Strip */}
                  <div
                    className="h-2 w-full rounded-[1px] flex items-center justify-between px-1"
                    style={{ backgroundColor: regionColor }}
                  >
                    {owner && (
                      <span
                        className="h-1.5 w-1.5 rounded-full border border-white"
                        style={{ backgroundColor: owner.color }}
                        title={`Owned by ${owner.name}`}
                      />
                    )}
                  </div>

                  {/* Tile Name & Price */}
                  <div className="my-auto py-0.5">
                    <div className="text-[10px] sm:text-[11px] font-bold leading-tight text-slate-900 dark:text-slate-100 line-clamp-2">
                      {tile.name}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {tile.kind === 'BADGE' ? `${tile.price}₽` : tile.subtitle}
                    </div>
                  </div>

                  {/* Bottom: Owner Badge & Trainer Tokens */}
                  <div className="flex items-center justify-between gap-1 min-h-[16px]">
                    {owner ? (
                      <div className="flex items-center gap-0.5" title={`Owned by ${owner.name}`}>
                        <PixelBadgeIcon color={owner.color} size={13} />
                      </div>
                    ) : (
                      <span className="text-[9px] font-mono-num text-slate-400">
                        {tile.element ? tile.element.slice(0, 3) : ''}
                      </span>
                    )}

                    <div className="flex items-center -space-x-1">
                      {trainersHere.map((t) => (
                        <span key={t.id} title={t.name} className="inline-flex">
                          <PixelPokeball size={15} color={t.color} />
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Sidebar: Trainers Roster, Tile Inspector, Battle Deck, Action Log */}
      <div className="xl:col-span-4 space-y-4">
        {/* Trainers Roster */}
        <div className="pixel-panel rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-pixel text-xs text-slate-900 dark:text-white">
              TRAINERS ({trainers.length})
            </h3>
            <button
              type="button"
              onClick={onFinishGameEarly}
              className="text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
            >
              Finish Match
            </button>
          </div>
          <div className="space-y-2">
            {trainers.map((t, idx) => {
              const isCurrent = idx === currentTrainerIndex;
              return (
                <div
                  key={t.id}
                  className={`flex items-center justify-between gap-2 rounded border-2 p-2.5 ${
                    isCurrent
                      ? 'border-rose-600 bg-rose-50/70 dark:bg-rose-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PixelPokeball size={20} color={t.color} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {t.name}
                        </span>
                        {t.isBot && (
                          <span className="text-[10px] font-mono-num text-slate-500 dark:text-slate-400">
                            CPU
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-num">
                        {t.badges.length} Badges · {t.cards.length} Cards · {t.legendaries.length} Leg.
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono-num text-sm font-bold text-slate-900 dark:text-white">
                      {t.money}₽
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {BOARD_TILES[t.position]?.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Trainer Hand Preview */}
        <div className="pixel-panel rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600 p-4">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-pixel text-xs text-slate-900 dark:text-white">
              {currentTrainer.name}&apos;s Deck
            </h3>
            <span className="text-xs font-mono-num text-slate-500 dark:text-slate-400">
              {currentTrainer.cards.length + currentTrainer.legendaries.length} cards
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[...currentTrainer.legendaries, ...currentTrainer.cards].map((cardId, i) => {
              const card = POKEMON_BY_ID[cardId];
              if (!card) return null;
              return (
                <div
                  key={`${card.id}-${i}`}
                  className="shrink-0 w-28 rounded border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-2"
                >
                  <div className="flex items-center justify-between">
                    <PixelPokemonSprite
                      primaryColor={card.primaryColor}
                      secondaryColor={card.secondaryColor}
                      type={card.type}
                      isLegendary={card.isLegendary}
                      size={28}
                    />
                    {card.isLegendary && <Sparkles className="h-3.5 w-3.5 text-amber-500" />}
                  </div>
                  <div className="mt-1 text-[11px] font-bold text-slate-900 dark:text-white truncate">
                    {card.name}
                  </div>
                  <div className={`text-[10px] ${ELEMENT_COLORS[card.type].text}`}>
                    {card.type} · {card.atk} ATK
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Tile Inspector */}
        <div className="pixel-panel rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {inspectedTile.region || 'League'} · {inspectedTile.subtitle}
              </div>
              <h4 className="font-pixel text-xs text-slate-900 dark:text-white mt-0.5">
                {inspectedTile.name}
              </h4>
            </div>
            {inspectedTile.kind === 'BADGE' && (
              <div className="text-right font-mono-num text-xs">
                <div className="font-bold text-slate-900 dark:text-white">
                  Cost {inspectedTile.price}₽
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  Toll {inspectedTile.rent}₽
                </div>
              </div>
            )}
          </div>

          {guardianCard && (
            <div className="mt-3 flex items-center gap-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5">
              <PixelPokemonSprite
                primaryColor={guardianCard.primaryColor}
                secondaryColor={guardianCard.secondaryColor}
                type={guardianCard.type}
                size={36}
              />
              <div className="min-w-0 flex-1 text-xs">
                <div className="font-semibold text-slate-900 dark:text-white">
                  Guardian: {guardianCard.name}
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-mono-num">
                  {guardianCard.type} · ATK {guardianCard.atk} · DEF {guardianCard.def}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Owner: {inspectedOwner ? inspectedOwner.name : 'Unclaimed Gym'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Turn Activity Log */}
        <div className="pixel-panel rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600 p-4">
          <h3 className="font-pixel text-xs text-slate-900 dark:text-white mb-2.5">
            LEAGUE LOG
          </h3>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs">
            {logs.length === 0 ? (
              <div className="text-slate-500 dark:text-slate-400">
                Roll dice or sprint to begin the championship.
              </div>
            ) : (
              logs.slice(0, 14).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-2 text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/70 pb-1 last:border-0"
                >
                  <span className="font-mono-num text-[10px] text-slate-400 shrink-0 mt-0.5">
                    T{entry.turn}
                  </span>
                  <span className="leading-snug">{entry.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
