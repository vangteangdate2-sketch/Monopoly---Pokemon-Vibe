import React, { useState } from 'react';
import { ArrowLeftRight, Sparkles, X } from 'lucide-react';
import { ELEMENT_COLORS, POKEMON_BY_ID } from '../data/pokemonData';
import type { Trainer } from '../types/game';
import { PixelPokemonSprite } from './PixelSprite';

interface LegendaryTradeModalProps {
  currentTrainer: Trainer;
  allTrainers: Trainer[];
  vaultLegendaries: string[];
  onClaimVault: (legendaryId: string, price: number) => void;
  onExecuteTrade: (params: {
    partnerId: string;
    requestedLegendaryId: string;
    offeredMoney: number;
    offeredLegendaryId?: string;
  }) => void;
  onClose: () => void;
}

export const LegendaryTradeModal: React.FC<LegendaryTradeModalProps> = ({
  currentTrainer,
  allTrainers,
  vaultLegendaries,
  onClaimVault,
  onExecuteTrade,
  onClose,
}) => {
  const [mode, setMode] = useState<'vault' | 'trade'>('vault');
  const otherTrainersWithLegendaries = allTrainers.filter(
    (t) => t.id !== currentTrainer.id && t.legendaries.length > 0
  );

  const [partnerId, setPartnerId] = useState<string>(
    otherTrainersWithLegendaries[0]?.id || ''
  );
  const selectedPartner = otherTrainersWithLegendaries.find((t) => t.id === partnerId);
  const [requestedLegId, setRequestedLegId] = useState<string>(
    selectedPartner?.legendaries[0] || ''
  );
  const [offeredLegId, setOfferedLegId] = useState<string>('');
  const [offeredMoney, setOfferedMoney] = useState<number>(350);
  const [tradeFeedback, setTradeFeedback] = useState<string | null>(null);

  const badgeDiscount = Math.min(200, currentTrainer.badges.length * 40);

  const handleProposeTrade = () => {
    if (!selectedPartner || !requestedLegId) return;
    if (offeredMoney > currentTrainer.money) {
      setTradeFeedback('Insufficient PokéDollars for this offer.');
      return;
    }

    // If partner is a bot, evaluate fair market value (>= 450₽ equivalent)
    const offerValue = offeredMoney + (offeredLegId ? 380 : 0);
    if (selectedPartner.isBot && offerValue < 420) {
      setTradeFeedback(
        `${selectedPartner.name} declined! Offer at least 420₽ (or include a Legendary swap).`
      );
      return;
    }

    onExecuteTrade({
      partnerId: selectedPartner.id,
      requestedLegendaryId: requestedLegId,
      offeredMoney,
      offeredLegendaryId: offeredLegId || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs">
      <div className="pixel-panel w-full max-w-2xl overflow-hidden rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-500">
        {/* Header with Pixel Vault Art */}
        <div className="relative h-36 w-full overflow-hidden border-b-2 border-slate-900 dark:border-slate-700 bg-slate-950">
          <img
            src="/src/assets/images/pixel_legendary_vault_1795016643487.jpg"
            alt="Retro pixel art ancient vault holding glowing elemental orbs"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover pixel-art"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-slate-950/25" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Legendary Trading Hall"
            className="absolute right-3 top-3 rounded bg-slate-900/80 p-1.5 text-slate-200 hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between">
            <div>
              <h2 className="font-pixel text-base text-amber-300">
                LEGENDARY TRADING HALL
              </h2>
              <p className="text-xs text-slate-200">
                {currentTrainer.name} · Balance:{' '}
                <span className="font-mono-num font-bold text-white">
                  {currentTrainer.money}₽
                </span>{' '}
                · Badge Discount: -{badgeDiscount}₽
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {/* Segmented Mode Tabs */}
          <div className="flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 p-1 mb-4 w-fit">
            <button
              type="button"
              onClick={() => setMode('vault')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                mode === 'vault'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Ancient Vault ({vaultLegendaries.length})
            </button>
            <button
              type="button"
              onClick={() => setMode('trade')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                mode === 'trade'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Trainer Trade Desk
            </button>
          </div>

          {mode === 'vault' ? (
            vaultLegendaries.length === 0 ? (
              <div className="rounded border border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                All Legendary Pokémon have been claimed! Switch to the Trainer Trade Desk to negotiate trades.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {vaultLegendaries.map((legId) => {
                  const card = POKEMON_BY_ID[legId];
                  if (!card) return null;
                  const price = Math.max(280, 520 - badgeDiscount);
                  const canAfford = currentTrainer.money >= price;
                  const el = ELEMENT_COLORS[card.type];
                  return (
                    <div
                      key={card.id}
                      className="flex items-center justify-between gap-3 rounded border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <PixelPokemonSprite
                          primaryColor={card.primaryColor}
                          secondaryColor={card.secondaryColor}
                          type={card.type}
                          isLegendary
                          size={44}
                        />
                        <div className="min-w-0">
                          <div className="font-pixel text-xs text-slate-900 dark:text-white truncate">
                            {card.name}
                          </div>
                          <div className={`text-xs font-medium ${el.text}`}>
                            {card.type} · {card.region}
                          </div>
                          <div className="text-[11px] font-mono-num text-slate-500 dark:text-slate-400">
                            ATK {card.atk} · DEF {card.def}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => {
                          onClaimVault(card.id, price);
                          onClose();
                        }}
                        className="pixel-btn inline-flex items-center gap-1 rounded bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 border-slate-900 hover:bg-amber-400 disabled:opacity-45 whitespace-nowrap shrink-0"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {price}₽
                      </button>
                    </div>
                  );
                })}
              </div>
            )
          ) : otherTrainersWithLegendaries.length === 0 ? (
            <div className="rounded border border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No rival trainers own a Legendary Pokémon yet. Claim one from the Ancient Vault first!
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Trade Partner
                  </label>
                  <select
                    value={partnerId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setPartnerId(nextId);
                      const found = otherTrainersWithLegendaries.find((t) => t.id === nextId);
                      setRequestedLegId(found?.legendaries[0] || '');
                      setTradeFeedback(null);
                    }}
                    className="w-full rounded border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    {otherTrainersWithLegendaries.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.legendaries.length} Legendary)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Request Legendary
                  </label>
                  <select
                    value={requestedLegId}
                    onChange={(e) => setRequestedLegId(e.target.value)}
                    className="w-full rounded border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    {(selectedPartner?.legendaries || []).map((id) => (
                      <option key={id} value={id}>
                        {POKEMON_BY_ID[id]?.name} (ATK {POKEMON_BY_ID[id]?.atk})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Offer PokéDollars (Max {currentTrainer.money}₽)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={currentTrainer.money}
                    step={50}
                    value={offeredMoney}
                    onChange={(e) => {
                      setOfferedMoney(Math.max(0, Number(e.target.value)));
                      setTradeFeedback(null);
                    }}
                    className="w-full rounded border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono-num text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Include Your Legendary (Optional)
                  </label>
                  <select
                    value={offeredLegId}
                    onChange={(e) => setOfferedLegId(e.target.value)}
                    className="w-full rounded border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value="">None (Cash Only)</option>
                    {currentTrainer.legendaries.map((id) => (
                      <option key={id} value={id}>
                        {POKEMON_BY_ID[id]?.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {tradeFeedback && (
                <div className="rounded border border-rose-500 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                  {tradeFeedback}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="pixel-btn rounded bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 border-slate-900 dark:border-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProposeTrade}
                  className="pixel-btn inline-flex items-center gap-2 rounded bg-indigo-600 px-4 py-2 text-xs font-semibold text-white border-slate-900 hover:bg-indigo-700"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  Confirm Trade
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
