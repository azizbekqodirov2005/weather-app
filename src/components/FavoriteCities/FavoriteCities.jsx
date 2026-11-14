import { Star, X, MapPin, History, Trash2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useWeatherContext } from '../../context/WeatherContext';
import { formatPlaceSecondary } from '../../utils/formatPlace';
import './FavoriteCities.css';

function PlaceRow({ place, active, onSelect, action }) {
  const { t } = useSettings();
  return (
    <li className={`places__row ${active ? 'places__row--active' : ''}`}>
      <button
        type="button"
        className="places__select"
        onClick={() => onSelect(place)}
        aria-current={active ? 'true' : undefined}
        aria-label={t('favorites.select', { name: place.name })}
      >
        <MapPin size={16} className="places__pin" aria-hidden="true" />
        <span className="places__text">
          <span className="places__name">{place.name}</span>
          <span className="places__secondary">
            {formatPlaceSecondary(place) || `${place.latitude.toFixed(2)}, ${place.longitude.toFixed(2)}`}
          </span>
        </span>
      </button>
      {action}
    </li>
  );
}

/**
 * Sidebar: favorite cities (persisted) + recently searched cities.
 */
export default function FavoriteCities() {
  const { t } = useSettings();
  const { favorites, removeFavorite, recent, clearRecent, selected, selectLocation } = useWeatherContext();

  return (
    <div className="places-stack">
      <section className="card fade-in" aria-labelledby="fav-title">
        <div className="card__header">
          <h2 id="fav-title" className="card__title">
            <Star size={18} aria-hidden="true" /> {t('favorites.title')}
          </h2>
          {favorites.length ? <span className="chip">{favorites.length}</span> : null}
        </div>
        <div className="card__body">
          {favorites.length === 0 ? (
            <p className="places__empty">{t('favorites.empty')}</p>
          ) : (
            <ul className="places">
              {favorites.map((f) => (
                <PlaceRow
                  key={f.id}
                  place={f}
                  active={selected?.id === f.id}
                  onSelect={selectLocation}
                  action={
                    <button
                      type="button"
                      className="btn btn--icon btn--ghost btn--sm places__remove"
                      onClick={() => removeFavorite(f.id)}
                      aria-label={`${t('favorites.remove')}: ${f.name}`}
                      title={t('favorites.remove')}
                    >
                      <X size={15} />
                    </button>
                  }
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="card fade-in" aria-labelledby="recent-title">
        <div className="card__header">
          <h2 id="recent-title" className="card__title">
            <History size={18} aria-hidden="true" /> {t('recent.title')}
          </h2>
          {recent.length ? (
            <button type="button" className="btn btn--ghost btn--sm" onClick={clearRecent}>
              <Trash2 size={14} aria-hidden="true" /> {t('recent.clear')}
            </button>
          ) : null}
        </div>
        <div className="card__body">
          {recent.length === 0 ? (
            <p className="places__empty">{t('recent.empty')}</p>
          ) : (
            <ul className="places">
              {recent.map((r) => (
                <PlaceRow key={r.id} place={r} active={selected?.id === r.id} onSelect={selectLocation} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
