import { LocateFixed, MapPinOff, ShieldAlert, Loader2, Info, RotateCcw } from 'lucide-react';
import Sheet from '../Sheet/Sheet';
import { useSettings } from '../../context/SettingsContext';
import { useWeatherContext } from '../../context/WeatherContext';
import { detectPlatform, isStandalone } from '../../utils/platform';

function DeniedSteps({ t }) {
  const { isIOS, isAndroid } = detectPlatform();
  const installed = isStandalone();
  let steps;
  if (isIOS) steps = [t('permission.ios1'), t('permission.ios2'), t('permission.ios3')];
  else if (isAndroid && installed) steps = [t('permission.androidApp1'), t('permission.androidApp2'), t('permission.androidGps')];
  else if (isAndroid) steps = [t('permission.androidBrowser1'), t('permission.androidBrowser2'), t('permission.androidGps')];
  else steps = [t('permission.desktop1'), t('permission.desktop2')];
  return (
    <ol className="sheet__steps">
      {steps.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ol>
  );
}

/**
 * In-app location permission flow:
 *  ask       – explain why, then trigger the browser's own permission dialog
 *  waiting   – the native dialog is open
 *  denied    – step-by-step guide to re-enable (auto-continues once allowed)
 *  insecure  – http:// page, browsers refuse geolocation
 *  unsupported
 */
export default function LocationSheet() {
  const { t } = useSettings();
  const { locationSheet: mode, allowLocation, closeLocationSheet, geo, resolvingLocation } = useWeatherContext();
  const busy = geo.status === 'locating' || resolvingLocation;

  if (!mode) return null;

  const common = { open: true, onClose: closeLocationSheet, closeLabel: t('install.close') };

  if (mode === 'ask' || mode === 'waiting') {
    return (
      <Sheet {...common} title={t('permission.askTitle')} icon={<LocateFixed size={20} />}>
        <p>{t('permission.askText')}</p>
        {mode === 'waiting' && busy ? (
          <p className="sheet__waiting" role="status">
            <Loader2 size={18} className="spin" aria-hidden="true" /> {t('permission.waiting')}
          </p>
        ) : null}
        <div className="sheet__actions">
          <button type="button" className="btn btn--primary" onClick={allowLocation} disabled={busy}>
            {busy ? <Loader2 size={18} className="spin" aria-hidden="true" /> : <LocateFixed size={18} aria-hidden="true" />}
            {t('permission.allow')}
          </button>
          <button type="button" className="btn btn--ghost" onClick={closeLocationSheet}>
            {t('permission.later')}
          </button>
        </div>
      </Sheet>
    );
  }

  if (mode === 'denied') {
    return (
      <Sheet {...common} title={t('permission.deniedTitle')} icon={<MapPinOff size={20} />} tone="danger">
        <p>{t('permission.deniedText')}</p>
        <DeniedSteps t={t} />
        <p className="sheet__note">
          <Info size={16} aria-hidden="true" />
          <span>{t('permission.autoHint')}</span>
        </p>
        <div className="sheet__actions">
          <button type="button" className="btn btn--primary" onClick={allowLocation} disabled={busy}>
            {busy ? <Loader2 size={18} className="spin" aria-hidden="true" /> : <RotateCcw size={18} aria-hidden="true" />}
            {busy ? t('permission.checking') : t('permission.retry')}
          </button>
          <button type="button" className="btn btn--ghost" onClick={closeLocationSheet}>
            {t('permission.searchInstead')}
          </button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      {...common}
      title={mode === 'insecure' ? t('permission.insecureTitle') : t('permission.deniedTitle')}
      icon={<ShieldAlert size={20} />}
      tone="danger"
    >
      <p>{mode === 'insecure' ? t('permission.insecureText') : t('permission.unsupportedText')}</p>
      <div className="sheet__actions">
        <button type="button" className="btn btn--primary" onClick={closeLocationSheet}>
          {t('permission.searchInstead')}
        </button>
      </div>
    </Sheet>
  );
}
