import { CloudOff, RefreshCw } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { describeError } from '../../utils/errorMessages';
import './Error.css';

/**
 * Full-width error card with a retry action (used when a forecast fails to load).
 */
export default function ErrorState({ error, onRetry }) {
  const { t } = useSettings();
  return (
    <div className="card error-state fade-in" role="alert">
      <CloudOff size={32} className="error-state__icon" aria-hidden="true" />
      <h2 className="error-state__title">{t('errors.title')}</h2>
      <p className="error-state__text">{describeError(error, t)}</p>
      {onRetry ? (
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          <RefreshCw size={16} aria-hidden="true" /> {t('errors.retry')}
        </button>
      ) : null}
    </div>
  );
}
