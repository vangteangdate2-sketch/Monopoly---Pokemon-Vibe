import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, Share2, X } from 'lucide-react';

interface ShareMilestoneModalProps {
  trainerName: string;
  wins: number;
  winRate: number;
  badgesTotal: number;
  pokedexCount: number;
  pokedexTotal: number;
  streak: number;
  onClose: () => void;
}

export const ShareMilestoneModal: React.FC<ShareMilestoneModalProps> = ({
  trainerName,
  wins,
  winRate,
  badgesTotal,
  pokedexCount,
  pokedexTotal,
  streak,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  const shareText = `PokéPoly Milestone — ${trainerName}: ${wins} League Wins · ${winRate}% Battle Win Rate · ${badgesTotal} Badges · Pokédex ${pokedexCount}/${pokedexTotal} · ${streak}-Day Training Streak!`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Retro dark cartridge background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);

    // Pixel border frame
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Top crimson header bar
    ctx.fillStyle = '#E11D48';
    ctx.fillRect(14, 14, w - 28, 54);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('POKEPOLY: PIXEL LEAGUE', 30, 48);

    ctx.fillStyle = '#FEF08A';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('TRAINER MILESTONE CARD', w - 215, 46);

    // Trainer Name
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(trainerName, 32, 112);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px monospace';
    ctx.fillText(`${streak}-DAY CONSISTENCY STREAK`, 32, 136);

    // 4 Stat blocks
    const stats = [
      { label: 'LEAGUE WINS', val: String(wins), color: '#34D399' },
      { label: 'BATTLE WIN %', val: `${winRate}%`, color: '#38BDF8' },
      { label: 'BADGES EARNED', val: String(badgesTotal), color: '#FBBF24' },
      { label: 'POKEDEX', val: `${pokedexCount}/${pokedexTotal}`, color: '#F472B6' },
    ];

    stats.forEach((s, idx) => {
      const bx = 32 + idx * 140;
      const by = 162;
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(bx, by, 128, 92);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, 128, 92);

      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(s.label, bx + 12, by + 28);

      ctx.fillStyle = s.color;
      ctx.font = 'bold 26px monospace';
      ctx.fillText(s.val, bx + 12, by + 68);
    });

    ctx.fillStyle = '#64748B';
    ctx.font = '12px monospace';
    ctx.fillText('Kanto · Johto · Hoenn · Sinnoh', 32, h - 28);
  }, [trainerName, wins, winRate, badgesTotal, pokedexCount, pokedexTotal, streak]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `pokepoly-milestone-${trainerName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PokéPoly Trainer Milestone',
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs">
      <div className="pixel-panel w-full max-w-xl rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-500 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-pixel text-sm text-slate-900 dark:text-white">
            Share Trainer Milestone
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Share Modal"
            className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={610}
          height={300}
          className="w-full rounded border-2 border-slate-900 dark:border-slate-700"
        />

        <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {shareText}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="pixel-btn inline-flex items-center gap-1.5 rounded bg-slate-100 dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 border-slate-900 dark:border-slate-600"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy Summary'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="pixel-btn inline-flex items-center gap-1.5 rounded bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 border-slate-900"
          >
            <Download className="h-3.5 w-3.5" />
            Download Card
          </button>
          <button
            type="button"
            onClick={handleNativeShare}
            className="pixel-btn inline-flex items-center gap-1.5 rounded bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white border-slate-900"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
};
