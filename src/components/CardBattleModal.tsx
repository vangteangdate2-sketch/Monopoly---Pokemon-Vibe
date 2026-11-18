import React, { useMemo, useState } from 'react';
import { Shield, Swords, Zap } from 'lucide-react';
import {
  BOARD_TILES,
  ELEMENT_COLORS,
  getTypeMultiplier,
  POKEMON_BY_ID,
} from '../data/pokemonData';
import type { ActiveBattle, BoardEvent, Trainer } from '../types/game';
import { PixelPokemonSprite } from './PixelSprite';

interface CardBattleModalProps {
  battle: ActiveBattle;
  attacker: Trainer;
  defender: Trainer | null;
  activeEvent: BoardEvent | null;
  onResolve: (result: {
    outcome: 'WIN' | 'LOSE' | 'BUY' | 'PAY_RENT';
    usedCardId?: string;
    attackerPower?: number;
    defenderPower?: number;
  }) => void;
}

export const CardBattleModal: React.FC<CardBattleModalProps> = ({
  battle,
  attacker,
  defender,
  activeEvent,
  onResolve,
}) => {
  const tile = BOARD_TILES[battle.tileId];
  const defenderCard = POKEMON_BY_ID[battle.defenderCardId];
  const playableCards = useMemo(() => {
    const uniqueIds = Array.from(new Set([...attacker.legendaries, ...attacker.cards]));
    return uniqueIds.map((id) => POKEMON_BY_ID[id]).filter(Boolean);
  }, [attacker.cards, attacker.legendaries]);

  const [selectedCardId, setSelectedCardId] = useState<string>(
    playableCards[0]?.id || 'pikachu'
  );
  const [clashState, setClashState] = useState<{
    resolved: boolean;
    won: boolean;
    atkScore: number;
    defScore: number;
    mult: number;
  } | null>(null);

  const selectedCard = POKEMON_BY_ID[selectedCardId] || playableCards[0];

  const previewMultiplier = selectedCard
    ? getTypeMultiplier(selectedCard.type, defenderCard.type)
    : 1;

  const weatherBonusAtk =
    activeEvent?.boostedType && selectedCard?.type === activeEvent.boostedType
      ? activeEvent.atkBonus || 0
      : 0;
  const weatherBonusDef =
    activeEvent?.boostedType && defenderCard.type === activeEvent.boostedType
      ? activeEvent.atkBonus || 0
      : 0;

  const handleBattle = () => {
    if (!selectedCard) return;
    const mult = getTypeMultiplier(selectedCard.type, defenderCard.type);
    const atkVariance = Math.floor(Math.random() * 14) - 4; // -4 to +9
    const defVariance = Math.floor(Math.random() * 12) - 5; // -5 to +6

    const atkScore = Math.round(
      (selectedCard.atk + selectedCard.def * 0.35 + weatherBonusAtk) * mult + atkVariance
    );
    const defScore = Math.round(
      defenderCard.atk * 0.92 + defenderCard.def * 0.35 + weatherBonusDef + defVariance
    );
    const won = atkScore >= defScore;
    setClashState({ resolved: true, won, atkScore, defScore, mult });
  };

  const canBuyOutright =
    battle.stakeType === 'CLAIM_BADGE' && attacker.money >= battle.costIfBought;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs">
      <div className="pixel-panel w-full max-w-2xl overflow-hidden rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-500">
        {/* Arena Banner */}
        <div className="relative h-44 w-full overflow-hidden border-b-2 border-slate-900 dark:border-slate-700 bg-slate-900">
          <img
            src="/src/assets/images/pixel_battle_arena_1795016642891.jpg"
            alt="Retro pixel art Pokemon stadium battle arena"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover pixel-art"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/30" />

          <div className="absolute inset-x-0 top-3 flex items-center justify-between px-5 text-xs text-slate-200">
            <span className="font-pixel text-amber-300">
              {battle.stakeType === 'CLAIM_BADGE' ? 'GYM BADGE DUEL' : 'TERRITORY CHALLENGE'}
            </span>
            <span className="font-mono-num">
              {tile.name} · {tile.badgeName}
            </span>
          </div>

          {/* Combatants */}
          <div className="absolute inset-x-0 bottom-3 flex items-end justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="rounded border-2 border-slate-200/40 bg-slate-900/80 p-1.5">
                {selectedCard && (
                  <PixelPokemonSprite
                    primaryColor={selectedCard.primaryColor}
                    secondaryColor={selectedCard.secondaryColor}
                    type={selectedCard.type}
                    isLegendary={selectedCard.isLegendary}
                    size={52}
                  />
                )}
              </div>
              <div className="text-white">
                <div className="text-xs text-slate-300">{attacker.name}</div>
                <div className="font-pixel text-sm">{selectedCard?.name}</div>
                <div className="text-xs font-mono-num text-amber-300">
                  ATK {selectedCard?.atk} · DEF {selectedCard?.def}
                  {weatherBonusAtk > 0 ? ` (+${weatherBonusAtk})` : ''}
                </div>
              </div>
            </div>

            <div className="font-pixel text-lg text-rose-400 px-2">VS</div>

            <div className="flex items-center gap-3 text-right">
              <div className="text-white">
                <div className="text-xs text-slate-300">
                  {defender ? `${defender.name}'s Guard` : 'Gym Guardian'}
                </div>
                <div className="font-pixel text-sm">{defenderCard.name}</div>
                <div className="text-xs font-mono-num text-sky-300">
                  ATK {defenderCard.atk} · DEF {defenderCard.def}
                  {weatherBonusDef > 0 ? ` (+${weatherBonusDef})` : ''}
                </div>
              </div>
              <div className="rounded border-2 border-slate-200/40 bg-slate-900/80 p-1.5">
                <PixelPokemonSprite
                  primaryColor={defenderCard.primaryColor}
                  secondaryColor={defenderCard.secondaryColor}
                  type={defenderCard.type}
                  isLegendary={defenderCard.isLegendary}
                  size={52}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          {!clashState ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300 mb-3">
                <span>
                  Select a Battle Card from <strong>{attacker.name}</strong>&apos;s deck
                </span>
                <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                  Matchup:{' '}
                  {previewMultiplier > 1
                    ? 'Super Effective (1.35x)'
                    : previewMultiplier < 1
                      ? 'Resisted (0.78x)'
                      : 'Neutral (1.0x)'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {playableCards.map((card) => {
                  const isSelected = card.id === selectedCard?.id;
                  const mult = getTypeMultiplier(card.type, defenderCard.type);
                  const el = ELEMENT_COLORS[card.type];
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setSelectedCardId(card.id)}
                      className={`flex items-center gap-2.5 rounded border-2 p-2.5 text-left transition-colors ${
                        isSelected
                          ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/40'
                          : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:border-slate-500'
                      }`}
                    >
                      <PixelPokemonSprite
                        primaryColor={card.primaryColor}
                        secondaryColor={card.secondaryColor}
                        type={card.type}
                        isLegendary={card.isLegendary}
                        size={36}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                          {card.name}
                        </div>
                        <div className={`text-[11px] font-medium ${el.text}`}>
                          {card.type} · {card.atk} ATK
                        </div>
                        <div className="text-[11px] font-mono-num text-slate-500 dark:text-slate-400">
                          {mult > 1 ? '1.35x Adv' : mult < 1 ? '0.78x Weak' : '1.0x Even'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  {battle.stakeType === 'CLAIM_BADGE' ? (
                    <>
                      Win battle to claim <strong>{tile.badgeName}</strong> for{' '}
                      <span className="font-mono-num font-bold text-emerald-700 dark:text-emerald-400">
                        {Math.round(battle.costIfBought * 0.5)}₽
                      </span>{' '}
                      (50% Victory Discount).
                    </>
                  ) : (
                    <>
                      Win to seize <strong>{tile.badgeName}</strong> from {defender?.name}. Lose to pay{' '}
                      <span className="font-mono-num font-bold text-rose-600 dark:text-rose-400">
                        {battle.rentPenalty}₽
                      </span>{' '}
                      toll.
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {battle.stakeType === 'CLAIM_BADGE' ? (
                    <button
                      type="button"
                      disabled={!canBuyOutright}
                      onClick={() => onResolve({ outcome: 'BUY' })}
                      className="pixel-btn rounded bg-slate-100 dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 border-slate-900 dark:border-slate-500 disabled:opacity-45 whitespace-nowrap shrink-0"
                    >
                      Buy Outright ({battle.costIfBought}₽)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onResolve({ outcome: 'PAY_RENT' })}
                      className="pixel-btn rounded bg-slate-100 dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 border-slate-900 dark:border-slate-500 whitespace-nowrap shrink-0"
                    >
                      Pay Toll ({battle.rentPenalty}₽)
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleBattle}
                    className="pixel-btn inline-flex items-center gap-2 rounded bg-rose-600 px-4 py-2 text-xs font-semibold text-white border-slate-900 hover:bg-rose-700 whitespace-nowrap shrink-0"
                  >
                    <Swords className="h-4 w-4" />
                    Battle with Card
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3.5">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    {selectedCard?.name} ({selectedCard?.moveName})
                  </div>
                  <div className="mt-1 font-mono-num text-2xl font-bold text-slate-900 dark:text-white">
                    {clashState.atkScore} PWR
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Multiplier: {clashState.mult}x
                  </div>
                </div>
                <div className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3.5">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-sky-500" />
                    {defenderCard.name} ({defenderCard.moveName})
                  </div>
                  <div className="mt-1 font-mono-num text-2xl font-bold text-slate-900 dark:text-white">
                    {clashState.defScore} PWR
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Defender Guard
                  </div>
                </div>
              </div>

              <div
                className={`rounded border-2 p-4 ${
                  clashState.won
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                    : 'border-rose-600 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="font-pixel text-sm">
                  {clashState.won ? 'VICTORY — TERRITORY WON!' : 'DEFEAT — GUARDIAN HELD!'}
                </div>
                <p className="mt-1 text-xs leading-relaxed">
                  {clashState.won
                    ? battle.stakeType === 'CLAIM_BADGE'
                      ? `${attacker.name} won ${tile.badgeName} and registered ${defenderCard.name} in the Pokédex!`
                      : `${attacker.name} seized ${tile.badgeName} from ${defender?.name}!`
                    : battle.stakeType === 'CLAIM_BADGE'
                      ? `${defenderCard.name} defended the Gym. Better luck next pass!`
                      : `${defender?.name}'s guard held firm. ${attacker.name} pays ${battle.rentPenalty}₽ toll.`}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    onResolve({
                      outcome: clashState.won ? 'WIN' : 'LOSE',
                      usedCardId: selectedCard?.id,
                      attackerPower: clashState.atkScore,
                      defenderPower: clashState.defScore,
                    })
                  }
                  className="pixel-btn rounded bg-slate-900 dark:bg-slate-100 px-5 py-2 text-xs font-semibold text-white dark:text-slate-900 border-slate-900"
                >
                  Continue Turn
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
