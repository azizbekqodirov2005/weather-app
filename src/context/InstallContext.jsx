import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const InstallContext = createContext(null);

/**
 * One shared install state for the whole app (the browser fires
 * `beforeinstallprompt` only once, so it must not live in several components).
 */
export function InstallProvider({ children }) {
  const { mode, promptInstall, isIOSSafari } = useInstallPrompt();
  const [guideOpen, setGuideOpen] = useState(false);

  /** Native dialog where supported, otherwise the step-by-step guide. */
  const install = useCallback(async () => {
    if (mode === 'native') return promptInstall();
    setGuideOpen(true);
    return 'guide';
  }, [mode, promptInstall]);

  const closeGuide = useCallback(() => setGuideOpen(false), []);

  const value = useMemo(
    () => ({ mode, canInstall: mode === 'native' || mode === 'ios' || mode === 'manual', install, guideOpen, closeGuide, isIOSSafari }),
    [mode, install, guideOpen, closeGuide, isIOSSafari],
  );
  return <InstallContext.Provider value={value}>{children}</InstallContext.Provider>;
}

export function useInstall() {
  const ctx = useContext(InstallContext);
  if (!ctx) throw new Error('useInstall must be used within InstallProvider');
  return ctx;
}
