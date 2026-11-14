import { Clock3, Umbrella } from 'lucide-react';
import WeatherIcon from '../WeatherIcon/WeatherIcon';
import { useSettings } from '../../context/SettingsContext';
import { formatPercent, formatTemperature } from '../../utils/conversions';
import { formatTime } from '../../utils/dateUtils';
import { getWeatherInfo } from '../../utils/weatherCodes';
import './HourlyForecast.css';

/**
 * Horizontally scrollable 24-hour strip.
 */
export default function HourlyForecast({ hourly }) {
  const { t, language, units } = useSettings();
  if (!Array.isArray(hourly) || hourly.length === 0) return null;

  return (
    <section className="card fade-in" aria-labelledby="hourly-title">
      <div className="card__header">
        <h2 id="hourly-title" className="card__title">
          <Clock3 size={18} aria-hidden="true" /> {t('hourly.title')}
        </h2>
        <span className="card__subtitle">{t('hourly.subtitle')}</span>
      </div>
      <div className="card__body">
        <ol className="scroller hourly" aria-label={t('hourly.title')}>
          {hourly.map((h, idx) => {
            const info = getWeatherInfo(h.weatherCode, h.isDay);
            return (
              <li key={h.time} className={`hourly__item ${idx === 0 ? 'hourly__item--now' : ''}`}>
                <span className="hourly__time">{idx === 0 ? t('current.now') : formatTime(h.time, language)}</span>
                <WeatherIcon code={h.weatherCode} isDay={h.isDay} size={28} />
                <span className="hourly__temp">{formatTemperature(h.temperature, units.temperature, { withUnit: false })}</span>
                <span
                  className={`hourly__precip ${
                    typeof h.precipitationProbability === 'number' && h.precipitationProbability >= 40 ? 'hourly__precip--high' : ''
                  }`}
                  title={t('hourly.precipitation')}
                >
                  <Umbrella size={12} aria-hidden="true" />
                  <span className="sr-only">{t('hourly.precipitation')}: </span>
                  {formatPercent(h.precipitationProbability)}
                </span>
                <span className="sr-only">{t(`weather.${info.key}`)}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
