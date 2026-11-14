import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Sun, Moon, Thermometer, Wind, Gauge, Languages, Download } from 'lucide-react';
import BrandLink from '../Brand/BrandLink';
import { useInstall } from '../../context/InstallContext';
import { useSettings } from '../../context/SettingsContext';
import { LANGUAGES } from '../../i18n';
import { PRESSURE_UNITS, TEMPERATURE_UNITS, WIND_UNITS } from '../../utils/conversions';
import './SettingsPanel.css';

function OptionGroup({ label, icon, options, value, onChange }) {
  return (
    <div className="settings__group">
      <div className="settings__label">
        {icon}
        <span>{label}</span>
      </div>
      <div className="segmented settings__segmented" role="radiogroup" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            className="segmented__option"
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Slide-over settings dialog: theme, language and units.
 */
export default function SettingsPanel({ open, onClose }) {
  const { t, theme, setTheme, language, setLanguage, units, setUnit } = useSettings();
  const { canInstall, install } = useInstall();
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  // Escape to close + focus management
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.activeElement;
    closeRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      if (previous && typeof previous.focus === 'function') previous.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  // Portal to <body>: the sticky header uses backdrop-filter, which would
  // otherwise become the containing block of this fixed overlay and clip it.
  return createPortal(
    <div className="settings" role="presentation">
      <div className="settings__backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="settings__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        ref={panelRef}
      >
        <div className="settings__head">
          <h2 id="settings-title" className="settings__title">
            {t('settings.title')}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="btn btn--icon btn--ghost"
            onClick={onClose}
            aria-label={t('settings.close')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="settings__body">
          <OptionGroup
            label={t('settings.theme')}
            icon={theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            options={[
              { value: 'dark', label: t('settings.dark') },
              { value: 'light', label: t('settings.light') },
            ]}
            value={theme}
            onChange={setTheme}
          />

          <OptionGroup
            label={t('settings.language')}
            icon={<Languages size={16} />}
            options={LANGUAGES.map((l) => ({ value: l.code, label: l.label }))}
            value={language}
            onChange={setLanguage}
          />

          <OptionGroup
            label={t('settings.temperature')}
            icon={<Thermometer size={16} />}
            options={TEMPERATURE_UNITS.map((u) => ({ value: u, label: t(`units.temperature.${u}`) }))}
            value={units.temperature}
            onChange={(v) => setUnit('temperature', v)}
          />

          <OptionGroup
            label={t('settings.windSpeed')}
            icon={<Wind size={16} />}
            options={WIND_UNITS.map((u) => ({ value: u, label: t(`units.wind.${u}`) }))}
            value={units.wind}
            onChange={(v) => setUnit('wind', v)}
          />

          <OptionGroup
            label={t('settings.pressure')}
            icon={<Gauge size={16} />}
            options={PRESSURE_UNITS.map((u) => ({ value: u, label: t(`units.pressure.${u}`) }))}
            value={units.pressure}
            onChange={(v) => setUnit('pressure', v)}
          />

          {canInstall ? (
            <button type="button" className="btn btn--primary settings__install" onClick={install}>
              <Download size={18} aria-hidden="true" /> {t('install.button')}
            </button>
          ) : null}

          <div className="settings__brand">
            <BrandLink variant="settings" />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
