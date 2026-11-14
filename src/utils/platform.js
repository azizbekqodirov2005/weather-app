/**
 * Lightweight platform detection used only to pick the right *instructions*
 * (install steps, how to re-enable location). Features are always detected
 * directly, never inferred from the user agent.
 */

export function detectPlatform(nav = typeof navigator !== 'undefined' ? navigator : undefined) {
  const ua = nav?.userAgent || '';
  // iPadOS 13+ reports itself as "Macintosh" but has touch points.
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && (nav?.maxTouchPoints || 0) > 1);
  const isAndroid = /Android/i.test(ua);
  // On iOS only Safari can add web apps to the Home Screen (CriOS/FxiOS/EdgiOS cannot reliably).
  const isIOSSafari = isIOS && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/i.test(ua);
  return { isIOS, isAndroid, isIOSSafari, isMobile: isIOS || isAndroid };
}

/** True when SkyCast runs as an installed app (home-screen / desktop window). */
export function isStandalone(win = typeof window !== 'undefined' ? window : undefined) {
  if (!win) return false;
  const mql = typeof win.matchMedia === 'function' ? win.matchMedia('(display-mode: standalone)') : null;
  return Boolean(mql?.matches || win.navigator?.standalone === true);
}
