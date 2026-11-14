import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useWeatherContext } from '../../context/WeatherContext';

const ICONS = { error: AlertTriangle, success: CheckCircle2, info: Info };

/**
 * Transient notification (favorites added, geolocation errors, …).
 */
export default function Toast() {
  const { t } = useSettings();
  const { notice, dismissNotice } = useWeatherContext();
  if (!notice) return null;
  const Icon = ICONS[notice.type] || Info;
  return (
    <div className={`toast toast--${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'} key={notice.id}>
      <Icon size={18} aria-hidden="true" />
      <span>{notice.message}</span>
      <button type="button" className="toast__close" onClick={dismissNotice} aria-label={t('errors.dismiss')}>
        <X size={16} />
      </button>
    </div>
  );
}
