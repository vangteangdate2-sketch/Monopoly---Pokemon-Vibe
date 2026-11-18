import React, { useState } from 'react';
import { Download, WifiOff } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWA';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="pixel-btn inline-flex items-center gap-2 rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white border-slate-900 hover:bg-emerald-700 whitespace-nowrap shrink-0"
      >
        <Download className="h-3.5 w-3.5" />
        Install App
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="pixel-btn inline-flex items-center gap-2 rounded bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 border-slate-900 dark:border-slate-500 whitespace-nowrap shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
          Install on iOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="pixel-panel w-full max-w-sm rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600 p-6">
              <h3 className="font-pixel text-sm text-slate-900 dark:text-white">
                Install PokéPoly on iOS
              </h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                1. Tap the <strong>Share</strong> button in Safari.<br />
                2. Scroll down and select <strong>Add to Home Screen</strong> for full offline travel play.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="pixel-btn mt-5 w-full rounded bg-slate-900 dark:bg-slate-100 py-2 text-xs font-semibold text-white dark:text-slate-900 border-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC<{ manualOffline?: boolean }> = ({ manualOffline }) => {
  const isOnline = useOnlineStatus();

  if (isOnline && !manualOffline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded border-2 border-slate-900 bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950 shadow-lg">
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>
        {manualOffline
          ? 'Travel Offline Mode — Saving locally, syncs when reconnected.'
          : 'Offline Mode — Playing from local cache.'}
      </span>
    </div>
  );
};
