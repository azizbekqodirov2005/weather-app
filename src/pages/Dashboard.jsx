import { useEffect } from 'react';
import { LocateFixed, Search, Loader2 } from 'lucide-react';
import CurrentWeather from '../components/CurrentWeather/CurrentWeather';
import HourlyForecast from '../components/HourlyForecast/HourlyForecast';
import WeeklyForecast from '../components/WeeklyForecast/WeeklyForecast';
import WeatherDetails from '../components/WeatherDetails/WeatherDetails';
import WeatherCharts from '../components/WeatherCharts/WeatherCharts';
import WeatherMap from '../components/WeatherMap/WeatherMap';
import FavoriteCities from '../components/FavoriteCities/FavoriteCities';
import DashboardSkeleton from '../components/Loading/DashboardSkeleton';
import ErrorState from '../components/Error/ErrorState';
import ErrorBoundary from '../components/Error/ErrorBoundary';
import SearchBar from '../components/SearchBar/SearchBar';
import InstallBanner from '../components/Install/InstallBanner';
import OfflineBanner from '../components/Install/OfflineBanner';
import { useSettings } from '../context/SettingsContext';
import { useWeatherContext } from '../context/WeatherContext';
import { getWeatherInfo } from '../utils/weatherCodes';
import './Dashboard.css';

function EmptyState() {
  const { t } = useSettings();
  const { useMyLocation, geo, resolvingLocation } = useWeatherContext();
  const locating = geo.status === 'locating' || resolvingLocation;
  return (
    <section className="card empty fade-in" aria-labelledby="empty-title">
      <div className="empty__art" aria-hidden="true">
        <span className="empty__sun" />
        <span className="empty__cloud" />
      </div>
      <h1 id="empty-title" className="empty__title">
        {t('empty.title')}
      </h1>
      <p className="empty__text">{t('empty.text')}</p>
      <div className="empty__search">
        <SearchBar />
      </div>
      <div className="empty__actions">
        <button type="button" className="btn btn--primary" onClick={useMyLocation} disabled={locating}>
          {locating ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <LocateFixed size={16} aria-hidden="true" />}
          {locating ? t('location.detecting') : t('empty.useLocation')}
        </button>
        <span className="empty__hint">
          <Search size={14} aria-hidden="true" /> {t('empty.tryCity')}
        </span>
      </div>
    </section>
  );
}

/**
 * Main page: composes every weather section for the selected location.
 */
export default function Dashboard() {
  const { theme } = useSettings();
  const { selected, weather, model } = useWeatherContext();

  // Dynamic background accent follows the current weather group.
  useEffect(() => {
    const root = document.documentElement;
    if (!model) {
      delete root.dataset.weather;
      return undefined;
    }
    const info = getWeatherInfo(model.current.weatherCode, model.current.isDay);
    root.dataset.weather = info.group === 'clear' && !model.current.isDay ? 'clear-night' : info.group;
    return () => {
      delete root.dataset.weather;
    };
  }, [model]);

  const banners = (
    <>
      <OfflineBanner />
      <InstallBanner />
    </>
  );

  if (!selected) {
    return (
      <div className="section-grid section-grid--sidebar">
        <div className="dashboard__main">
          {banners}
          <EmptyState />
        </div>
        <FavoriteCities />
      </div>
    );
  }

  const loadingFirst = weather.status === 'loading' && !weather.data;

  return (
    <div className="section-grid section-grid--sidebar dashboard">
      <div className="dashboard__main">
        {banners}
        {loadingFirst ? <DashboardSkeleton /> : null}

        {weather.status === 'error' ? <ErrorState error={weather.error} onRetry={weather.retry} /> : null}

        {model ? (
          <>
            <CurrentWeather model={model} location={selected} fetchedAt={weather.fetchedAt} />
            <HourlyForecast hourly={model.hourly} />
            <div className="section-grid section-grid--2">
              <WeeklyForecast daily={model.daily} />
              <WeatherDetails current={model.current} />
            </div>
            <ErrorBoundary>
              <WeatherCharts hourly={model.hourly} daily={model.daily} />
            </ErrorBoundary>
            <ErrorBoundary>
              <WeatherMap location={selected} theme={theme} />
            </ErrorBoundary>
          </>
        ) : null}
      </div>

      <aside className="dashboard__side" aria-label="Favorites">
        <FavoriteCities />
      </aside>
    </div>
  );
}
