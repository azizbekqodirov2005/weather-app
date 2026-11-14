import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useInstall } from '../../context/InstallContext';
import './Install.css';

const DISMISS_KEY = 'skycast:install-dismissed-at';
const DISMISS_DAYS = 14;

function recentlyDismissed() {
  try {
    const at = Number(window.localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 3600 * 1000;
  } catch {
    return false;
  }
}

/**
 * Compact "Install SkyCast" card. Shown only where installing is really possible
 * right now (native prompt available, or iOS) and not recently dismissed.
 */
export default function InstallBanner() {
  const { t } = useSettings();
  const { mode, install } = useInstall();
  const [hidden, setHidden] = useState(recentlyDismissed);

  if (hidden || (mode !== 'native' && mode !== 'ios')) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

  return (
    <section className="install-banner fade-in" aria-label={t('install.title')}>
      <img className="install-banner__icon" src="/pwa-192x192.png" alt="" width="44" height="44" />
      <div className="install-banner__text">
        <strong>{t('install.title')}</strong>
        <span>{t('install.text')}</span>
      </div>
      <div className="install-banner__actions">
        <button type="button" className="btn btn--primary btn--sm" onClick={install}>
          <Download size={16} aria-hidden="true" /> {t('install.confirm')}
        </button>
        <button type="button" className="btn btn--icon btn--ghost install-banner__close" onClick={dismiss} aria-label={t('install.later')} title={t('install.later')}>
          <X size={16} />
        </button>
      </div>
    </section>
  );
}
