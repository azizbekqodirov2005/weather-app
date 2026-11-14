import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search, X, Loader2, MapPin, AlertTriangle, History } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { searchCities } from '../../services/geocodingApi';
import { isAbortError } from '../../services/apiClient';
import { useTranslation } from '../../context/SettingsContext';
import { useWeatherContext } from '../../context/WeatherContext';
import { formatPlaceSecondary } from '../../utils/formatPlace';
import './SearchBar.css';

export default function SearchBar({ autoFocus = false }) {
  const { t, language } = useTranslation();
  const { selectLocation, recent } = useWeatherContext();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [rawStatus, setStatus] = useState('idle'); // idle | success | error (for the last completed request)
  const [resultsState, setResults] = useState({ query: '', list: [] });
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounced = useDebounce(query, 350);
  const controllerRef = useRef(null);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listId = useId();

  const trimmed = debounced.trim();
  const showRecent = open && query.trim().length < 2 && recent.length > 0;
  // Derived: results only count when they belong to the current debounced query.
  const results = useMemo(() => (resultsState.query === trimmed ? resultsState.list : []), [resultsState, trimmed]);
  const status = trimmed.length < 2 ? 'idle' : resultsState.query === trimmed ? rawStatus : 'loading';

  useEffect(() => {
    if (trimmed.length < 2) return undefined;
    const controller = new AbortController();
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = controller;
    searchCities(trimmed, { language, signal: controller.signal })
      .then((list) => {
        if (controller.signal.aborted) return;
        setResults({ query: trimmed, list });
        setStatus('success');
        setActiveIndex(-1);
      })
      .catch((err) => {
        if (isAbortError(err) || controller.signal.aborted) return;
        setResults({ query: trimmed, list: [] });
        setStatus('error');
      });
    return () => controller.abort();
  }, [trimmed, language]);

  // Close on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, []);

  const choose = useCallback(
    (place) => {
      selectLocation(place);
      setQuery('');
      setResults({ query: '', list: [] });
      setStatus('idle');
      setOpen(false);
      inputRef.current?.blur();
    },
    [selectLocation],
  );

  const items = useMemo(() => (showRecent ? recent : results), [showRecent, recent, results]);

  const onKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && items[activeIndex]) {
        e.preventDefault();
        choose(items[activeIndex]);
      } else if (items.length === 1) {
        e.preventDefault();
        choose(items[0]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const typing = query.trim() !== trimmed || (query.trim().length >= 2 && status === 'loading');
  const showPanel = open && (query.trim().length > 0 || showRecent);

  return (
    <div className={`search ${open ? 'search--open' : ''}`} ref={rootRef} role="search">
      <label className="sr-only" htmlFor={`${listId}-input`}>
        {t('search.label')}
      </label>
      <div className="search__field">
        <Search size={18} className="search__icon" aria-hidden="true" />
        <input
          id={`${listId}-input`}
          ref={inputRef}
          className="search__input"
          type="text"
          autoComplete="off"
          spellCheck="false"
          placeholder={t('search.placeholder')}
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={`${listId}-list`}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
        />
        {typing && query.trim().length >= 2 ? (
          <Loader2 size={18} className="search__spinner" aria-label={t('search.searching')} />
        ) : null}
        {query ? (
          <button
            type="button"
            className="search__clear"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label={t('search.clear')}
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <div className="search__panel" id={`${listId}-list`} role="listbox" aria-label={t('search.results')}>
          {showRecent ? (
            <div className="search__group">
              <History size={14} aria-hidden="true" /> {t('recent.title')}
            </div>
          ) : null}

          {!showRecent && query.trim().length < 2 ? (
            <div className="search__hint">{t('search.typeMore')}</div>
          ) : null}

          {!showRecent && query.trim().length >= 2 && (status === 'loading' || typing) ? (
            <div className="search__hint">
              <Loader2 size={16} className="search__spinner" aria-hidden="true" /> {t('search.searching')}
            </div>
          ) : null}

          {!showRecent && status === 'error' && !typing ? (
            <div className="search__hint search__hint--error">
              <AlertTriangle size={16} aria-hidden="true" /> {t('search.error')}
            </div>
          ) : null}

          {!showRecent && status === 'success' && !typing && results.length === 0 ? (
            <div className="search__hint">{t('search.noResults', { query: trimmed })}</div>
          ) : null}

          {(showRecent || (status === 'success' && !typing)) &&
            items.map((place, idx) => (
              <button
                key={`${place.id}-${place.geoId ?? idx}`}
                type="button"
                id={`${listId}-opt-${idx}`}
                role="option"
                aria-selected={activeIndex === idx}
                className={`search__item ${activeIndex === idx ? 'search__item--active' : ''}`}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => choose(place)}
              >
                <MapPin size={16} className="search__item-icon" aria-hidden="true" />
                <span className="search__item-text">
                  <span className="search__item-name">
                    {place.name}
                    {place.countryCode ? <span className="search__item-cc">{place.countryCode}</span> : null}
                  </span>
                  <span className="search__item-secondary">
                    {formatPlaceSecondary(place) || `${place.latitude.toFixed(2)}, ${place.longitude.toFixed(2)}`}
                  </span>
                </span>
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}
