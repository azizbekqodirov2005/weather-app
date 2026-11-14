import { useState } from 'react';
import { LocateFixed, Loader2, RefreshCw, Settings, Sun, Moon, CloudSun, Download } from 'lucide-react';
import { useInstall } from '../../context/InstallContext';
import SearchBar from '../SearchBar/SearchBar';
import SettingsPanel from '../Settings/SettingsPanel';
import { useSettings } from '../../context/SettingsContext';
import { useWeatherContext } from '../../context/WeatherContext';
import { LANGUAGES } from '../../i18n';
import './Header.css';

export default function Header() {
  const { t, theme, toggleTheme, language, setLanguage } = useSettings();
  const { useMyLocation, geo, resolvingLocation, weather, selected } = useWeatherContext();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { canInstall, install } = useInstall();

  const locating = geo.status === 'locating' || resolvingLocation;
  const refreshing = weather.status === 'loading' && Boolean(weather.data);

  return (
    <header className="header">
      <div className="container header__inner">
        <a className="header__brand" href="#top" aria-label={t('app.name')}>
          <span className="header__logo" aria-hidden="true">
            <CloudSun size={22} strokeWidth={2} />
          </span>
          <span className="header__brand-text">
            <span className="header__name">{t('app.name')}</span>
            <span className="header__tagline">{t('app.tagline')}</span>
          </span>
        </a>

        <div className="header__search">
          <SearchBar />
        </div>

        <div className="header__actions">
          {canInstall ? (
            <button
              type="button"
              className="btn btn--icon header__action header__install"
              onClick={install}
              aria-label={t('install.button')}
              title={t('install.button')}
            >
              <Download size={18} />
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn--icon header__action"
            onClick={useMyLocation}
            disabled={locating}
            aria-label={t('nav.myLocation')}
            title={t('nav.myLocation')}
          >
            {locating ? <Loader2 size={18} className="spin" /> : <LocateFixed size={18} />}
          </button>

          <button
            type="button"
            className="btn btn--icon header__action"
            onClick={weather.refresh}
            disabled={!selected || weather.status === 'loading'}
            aria-label={t('nav.refresh')}
            title={t('nav.refresh')}
          >
            <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
          </button>

          <div className="segmented header__lang" role="radiogroup" aria-label={t('nav.language')}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                role="radio"
                aria-checked={language === l.code}
                className="segmented__option"
                onClick={() => setLanguage(l.code)}
                title={l.label}
              >
                {l.short}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn--icon header__action header__theme"
            onClick={toggleTheme}
            aria-label={t('settings.toggleTheme')}
            title={t('settings.toggleTheme')}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            type="button"
            className="btn btn--icon header__action"
            onClick={() => setSettingsOpen(true)}
            aria-label={t('nav.settings')}
            title={t('nav.settings')}
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}
