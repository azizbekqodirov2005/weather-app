import { Droplets, Wind, Gauge, Sun, Eye, Cloud, Thermometer, LayoutGrid, Navigation } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import {
  degreesToCompass,
  formatPercent,
  formatPressure,
  formatTemperature,
  formatVisibility,
  formatWindSpeed,
  roundTo,
  uvCategoryKey,
} from '../../utils/conversions';
import './WeatherDetails.css';

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

function DetailCard({ icon, label, value, hint, meter, children }) {
  return (
    <div className="detail">
      <div className="detail__head">
        <span className="detail__icon">{icon}</span>
        <span className="detail__label">{label}</span>
      </div>
      <div className="detail__value">{value}</div>
      {meter !== undefined && meter !== null ? (
        <div className="detail__meter" aria-hidden="true">
          <span className="detail__meter-fill" style={{ width: `${Math.max(0, Math.min(100, meter))}%` }} />
        </div>
      ) : null}
      {children}
      {hint ? <div className="detail__hint">{hint}</div> : null}
    </div>
  );
}

/**
 * Grid of secondary metrics (humidity, wind, pressure, UV, visibility, cloud cover, dew point).
 */
export default function WeatherDetails({ current }) {
  const { t, units } = useSettings();
  const compass = degreesToCompass(current.windDirection);
  const uvKey = uvCategoryKey(current.uvIndex);

  return (
    <section className="card fade-in" aria-labelledby="details-title">
      <div className="card__header">
        <h2 id="details-title" className="card__title">
          <LayoutGrid size={18} aria-hidden="true" /> {t('details.title')}
        </h2>
      </div>
      <div className="card__body details">
        <DetailCard
          icon={<Droplets size={18} />}
          label={t('current.humidity')}
          value={formatPercent(current.humidity)}
          meter={current.humidity}
          hint={t('details.humidityHint')}
        />

        <DetailCard
          icon={<Wind size={18} />}
          label={t('current.wind')}
          value={formatWindSpeed(current.windSpeed, units.wind, t)}
          hint={
            compass
              ? t('details.windHint', { dir: `${t(`compass.${compass}`)} · ${Math.round(current.windDirection)}°` })
              : undefined
          }
        >
          {isNum(current.windDirection) ? (
            <div className="detail__compass" aria-hidden="true">
              <Navigation size={18} style={{ transform: `rotate(${current.windDirection + 180 - 45}deg)` }} />
              {isNum(current.windGusts) ? (
                <span className="detail__sub">
                  {t('current.gusts')} {formatWindSpeed(current.windGusts, units.wind, t)}
                </span>
              ) : null}
            </div>
          ) : null}
        </DetailCard>

        <DetailCard
          icon={<Gauge size={18} />}
          label={t('current.pressure')}
          value={formatPressure(current.pressure, units.pressure, t)}
          hint={t('details.pressureHint')}
        />

        <DetailCard
          icon={<Sun size={18} />}
          label={t('current.uvIndex')}
          value={
            <>
              {isNum(current.uvIndex) ? roundTo(current.uvIndex, 1) : '—'}
              {uvKey ? <span className={`detail__badge detail__badge--${uvKey}`}>{t(`uv.${uvKey}`)}</span> : null}
            </>
          }
          meter={isNum(current.uvIndex) ? (current.uvIndex / 11) * 100 : null}
          hint={isNum(current.uvIndexMax) ? t('details.uvHint', { max: roundTo(current.uvIndexMax, 1) }) : undefined}
        />

        <DetailCard
          icon={<Eye size={18} />}
          label={t('current.visibility')}
          value={formatVisibility(current.visibility, units.wind, t)}
          hint={t('details.visibilityHint')}
        />

        <DetailCard
          icon={<Cloud size={18} />}
          label={t('current.cloudCover')}
          value={formatPercent(current.cloudCover)}
          meter={current.cloudCover}
          hint={t('details.cloudHint')}
        />

        <DetailCard
          icon={<Thermometer size={18} />}
          label={t('current.dewPoint')}
          value={formatTemperature(current.dewPoint, units.temperature)}
          hint={t('details.dewHint')}
        />
      </div>
    </section>
  );
}
