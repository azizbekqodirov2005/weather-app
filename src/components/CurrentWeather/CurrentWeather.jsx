import { MapPin, Star, Droplets, Wind, Sunrise, Sunset, ArrowUp, ArrowDown, Clock, LocateFixed } from 'lucide-react';
import WeatherIcon from '../WeatherIcon/WeatherIcon';
import { useSettings } from '../../context/SettingsContext';
import { useWeatherContext } from '../../context/WeatherContext';
import { getWeatherInfo } from '../../utils/weatherCodes';
import { degreesToCompass, formatPercent, formatTemperature, formatWindSpeed } from '../../utils/conversions';
import { formatClock, formatLongDate, formatRelativeTime, formatTime } from '../../utils/dateUtils';
import { formatPlaceSecondary } from '../../utils/formatPlace';
import './CurrentWeather.css';

/**
 * Hero card with the selected city's current conditions.
 */
export default function CurrentWeather({ model, location, fetchedAt }) {
  const { t, language, units } = useSettings();
  const { isFavorite, toggleFavorite } = useWeatherContext();
  const { current } = model;
  const info = getWeatherInfo(current.weatherCode, current.isDay);
  const favorite = isFavorite(location.id);
  const compass = degreesToCompass(current.windDirection);
  const secondary = formatPlaceSecondary(location);

  return (
    <section className={`card hero hero--${info.accent} fade-in`} aria-labelledby="hero-city">
      <div className="hero__top">
        <div className="hero__place">
          <h1 id="hero-city" className="hero__city">
            {location.isCurrentLocation ? (
              <LocateFixed size={18} className="hero__pin" aria-hidden="true" />
            ) : (
              <MapPin size={18} className="hero__pin" aria-hidden="true" />
            )}
            {location.name}
            {location.countryCode ? <span className="hero__cc">{location.countryCode}</span> : null}
          </h1>
          <p className="hero__secondary">
            {secondary || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
          </p>
          <p className="hero__date">
            <Clock size={14} aria-hidden="true" />
            {formatLongDate(current.time, language)} · {formatTime(current.time, language)}
            {model.timezoneAbbreviation ? <span className="hero__tz">{model.timezoneAbbreviation}</span> : null}
          </p>
        </div>

        <button
          type="button"
          className={`btn btn--icon hero__fav ${favorite ? 'hero__fav--on' : ''}`}
          onClick={() => toggleFavorite(location)}
          aria-pressed={favorite}
          aria-label={favorite ? t('favorites.remove') : t('favorites.add')}
          title={favorite ? t('favorites.remove') : t('favorites.add')}
        >
          <Star size={18} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="hero__main">
        <div className="hero__temp-block">
          <div className="hero__temp">{formatTemperature(current.temperature, units.temperature, { withUnit: false })}</div>
          <div className="hero__temp-meta">
            <span className="hero__unit">{t(`units.temperature.${units.temperature}`)}</span>
            <span className="hero__feels">
              {t('current.feelsLike')} {formatTemperature(current.apparentTemperature, units.temperature)}
            </span>
          </div>
        </div>

        <div className="hero__condition">
          <WeatherIcon code={current.weatherCode} isDay={current.isDay} size={84} className="hero__icon" decorative />
          <div className="hero__condition-text">
            <span className="hero__desc">{t(`weather.${info.key}`)}</span>
            <span className="hero__minmax">
              <span>
                <ArrowUp size={14} aria-hidden="true" /> {formatTemperature(current.tempMax, units.temperature)}
              </span>
              <span>
                <ArrowDown size={14} aria-hidden="true" /> {formatTemperature(current.tempMin, units.temperature)}
              </span>
            </span>
          </div>
        </div>
      </div>

      <dl className="hero__stats">
        <div className="hero__stat">
          <dt>
            <Droplets size={15} aria-hidden="true" /> {t('current.humidity')}
          </dt>
          <dd>{formatPercent(current.humidity)}</dd>
        </div>
        <div className="hero__stat">
          <dt>
            <Wind size={15} aria-hidden="true" /> {t('current.wind')}
          </dt>
          <dd>
            {formatWindSpeed(current.windSpeed, units.wind, t)}
            {compass ? <span className="hero__stat-sub"> {t(`compass.${compass}`)}</span> : null}
          </dd>
        </div>
        <div className="hero__stat">
          <dt>
            <Sunrise size={15} aria-hidden="true" /> {t('current.sunrise')}
          </dt>
          <dd>{formatTime(current.sunrise, language)}</dd>
        </div>
        <div className="hero__stat">
          <dt>
            <Sunset size={15} aria-hidden="true" /> {t('current.sunset')}
          </dt>
          <dd>{formatTime(current.sunset, language)}</dd>
        </div>
      </dl>

      {typeof fetchedAt === 'number' ? (
        <p className="hero__updated">
          {t('current.lastUpdated')}: {formatClock(fetchedAt, language)} ({formatRelativeTime(fetchedAt, language)})
        </p>
      ) : null}
    </section>
  );
}
