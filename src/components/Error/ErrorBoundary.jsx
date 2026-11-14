import { Component } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { createTranslator, DEFAULT_LANGUAGE } from '../../i18n';
import './Error.css';

/**
 * Catches render errors so a single broken widget never blanks the whole app.
 * It does not have access to context (it may wrap the providers), so it reads
 * the persisted language directly for its message.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface the real cause in the console; never swallow it silently.
    console.error('[SkyCast] UI error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    let language = DEFAULT_LANGUAGE;
    try {
      const stored = JSON.parse(window.localStorage.getItem('skycast:language'));
      if (typeof stored === 'string') language = stored;
    } catch {
      /* ignore */
    }
    const t = createTranslator(language);

    return (
      <div className="error-state error-state--boundary" role="alert">
        <AlertOctagon size={32} className="error-state__icon" aria-hidden="true" />
        <h2 className="error-state__title">{t('errors.title')}</h2>
        <p className="error-state__text">{t('errors.boundary')}</p>
        <p className="error-state__detail">{String(this.state.error?.message || this.state.error)}</p>
        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
          <RotateCcw size={16} aria-hidden="true" /> {t('errors.reload')}
        </button>
      </div>
    );
  }
}
