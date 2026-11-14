import { useCallback, useEffect, useState } from 'react';
import { detectPlatform, isStandalone } from '../utils/platform';

/**
 * PWA install support.
 *
 * - Chromium browsers (Android, Windows, macOS, ChromeOS) fire `beforeinstallprompt`;
 *   we keep the event and show our own "Install" button that triggers it.
 * - iOS/iPadOS has no install API: we show "Share → Add to Home Screen" steps.
 * - Nothing is shown once the app already runs installed.
 *
 * mode: 'native' | 'ios' | 'manual' | 'installed' | 'unavailable'
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const platform = detectPlatform();

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault(); // keep the browser's mini-infobar from appearing; we show our own button
      setDeferred(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    const mql = window.matchMedia?.('(display-mode: standalone)');
    const onMode = (e) => setInstalled(e.matches);
    mql?.addEventListener?.('change', onMode);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      mql?.removeEventListener?.('change', onMode);
    };
  }, []);

  let mode = 'unavailable';
  if (installed) mode = 'installed';
  else if (deferred) mode = 'native';
  else if (platform.isIOS) mode = 'ios';
  else if (platform.isAndroid) mode = 'manual';

  /** Shows the native install dialog. Resolves to 'accepted' | 'dismissed' | 'unavailable'. */
  const promptInstall = useCallback(async () => {
    if (!deferred) return 'unavailable';
    deferred.prompt();
    let outcome = 'dismissed';
    try {
      ({ outcome } = await deferred.userChoice);
    } catch {
      /* ignore */
    }
    // An install prompt event can only be used once.
    setDeferred(null);
    if (outcome === 'accepted') setInstalled(true);
    return outcome;
  }, [deferred]);

  return { mode, promptInstall, isIOSSafari: platform.isIOSSafari };
}
