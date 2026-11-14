import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { createTranslator, DEFAULT_LANGUAGE, isSupportedLanguage } from '../i18n';
import { PRESSURE_UNITS, TEMPERATURE_UNITS, WIND_UNITS } from '../utils/conversions';

const STORAGE_KEYS = {
  theme: 'skycast:theme',
  language: 'skycast:language',
  units: 'skycast:units',
};

const DEFAULT_UNITS = { temperature: 'celsius', wind: 'kmh', pressure: 'hpa' };

const isTheme = (v) => v === 'dark' || v === 'light';
const isUnits = (v) =>
  v &&
  typeof v === 'object' &&
  TEMPERATURE_UNITS.includes(v.temperature) &&
  WIND_UNITS.includes(v.wind) &&
  PRESSURE_UNITS.includes(v.pressure);

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useLocalStorage(STORAGE_KEYS.theme, 'dark', isTheme);
  const [language, setLanguageState] = useLocalStorage(STORAGE_KEYS.language, DEFAULT_LANGUAGE, isSupportedLanguage);
  const [units, setUnits] = useLocalStorage(STORAGE_KEYS.units, DEFAULT_UNITS, isUnits);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    // status bar / title bar colour (Android, installed app window)
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', theme === 'dark' ? '#070d1f' : '#eef4fb'));
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [setTheme]);
  const setLanguage = useCallback(
    (code) => {
      if (isSupportedLanguage(code)) setLanguageState(code);
    },
    [setLanguageState],
  );
  const setUnit = useCallback(
    (kind, value) => {
      setUnits((prev) => {
        const next = { ...prev, [kind]: value };
        return isUnits(next) ? next : prev;
      });
    },
    [setUnits],
  );

  const t = useMemo(() => createTranslator(language), [language]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, language, setLanguage, units, setUnit, t }),
    [theme, setTheme, toggleTheme, language, setLanguage, units, setUnit, t],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

export function useTranslation() {
  const { t, language } = useSettings();
  return { t, language };
}
