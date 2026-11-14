import { CalendarDays, Umbrella, Wind } from 'lucide-react';
import WeatherIcon from '../WeatherIcon/WeatherIcon';
import { useSettings } from '../../context/SettingsContext';
import { formatPercent, formatTemperature, formatWindSpeed } from '../../utils/conversions';
import { formatShortDate, formatWeekday } from '../../utils/dateUtils';
import { getWeatherInfo } from '../../utils/weatherCodes';
import './WeeklyForecast.css';

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * 7-day list with a temperature range bar scaled to the week's extremes.
 */
export default function WeeklyForecast({ daily }) {
  const { t, language, units } = useSettings();
  if (!Array.isArray(daily) || daily.length === 0) return null;

  const mins = daily.map((d) => d.tempMin).filter(isNum);
  const maxs = daily.map((d) => d.tempMax).filter(isNum);
  const weekMin = mins.length ? Math.min(...mins) : 0;
  const weekMax = maxs.length ? Math.max(...maxs) : 1;
  const span = Math.max(weekMax - weekMin, 1);

  return (
    <section className="card fade-in" aria-labelledby="daily-title">
      <div className="card__header">
        <h2 id="daily-title" className="card__title">
          <CalendarDays size={18} aria-hidden="true" /> {t('daily.title')}
        </h2>
      </div>
      <div className="card__body">
        <ol className="daily">
          {daily.map((d, idx) => {
            const info = getWeatherInfo(d.weatherCode, true);
            const left = isNum(d.tempMin) ? ((d.tempMin - weekMin) / span) * 100 : 0;
            const right = isNum(d.tempMax) ? 100 - ((d.tempMax - weekMin) / span) * 100 : 0;
            const dayLabel = idx === 0 ? t('daily.today') : idx === 1 ? t('daily.tomorrow') : formatWeekday(d.date, language, 'long');
            return (
              <li key={d.date} className="daily__row">
                <div className="daily__day">
                  <span className="daily__weekday">{dayLabel}</span>
                  <span className="daily__date">{formatShortDate(d.date, language)}</span>
                </div>

                <WeatherIcon code={d.weatherCode} isDay size={28} className="daily__icon" />

                <div className="daily__info">
                  <span className="daily__desc">{t(`weather.${info.key}`)}</span>
                  <span className="daily__meta">
                    <span className="daily__chip" title={t('daily.precip')}>
                      <Umbrella size={13} aria-hidden="true" />
                      <span className="sr-only">{t('daily.precip')}: </span>
                      {formatPercent(d.precipitationProbability)}
                    </span>
                    <span className="daily__chip" title={t('daily.wind')}>
                      <Wind size={13} aria-hidden="true" />
                      <span className="sr-only">{t('daily.wind')}: </span>
                      {formatWindSpeed(d.windSpeedMax, units.wind, t)}
                    </span>
                  </span>
                </div>

                <div className="daily__range">
                  <span className="daily__min">{formatTemperature(d.tempMin, units.temperature, { withUnit: false })}</span>
                  <span className="daily__bar" aria-hidden="true">
                    <span className="daily__bar-fill" style={{ left: `${left}%`, right: `${right}%` }} />
                  </span>
                  <span className="daily__max">{formatTemperature(d.tempMax, units.temperature, { withUnit: false })}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
