import {
  Sun,
  Moon,
  SunDim,
  CloudSun,
  CloudMoon,
  Cloudy,
  CloudFog,
  CloudDrizzle,
  CloudHail,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  Snowflake,
  CloudSunRain,
  CloudMoonRain,
  CloudLightning,
} from 'lucide-react';
import { getWeatherInfo } from '../../utils/weatherCodes';
import { useTranslation } from '../../context/SettingsContext';
import './WeatherIcon.css';

const ICONS = {
  Sun,
  Moon,
  SunDim,
  CloudSun,
  CloudMoon,
  Cloudy,
  CloudFog,
  CloudDrizzle,
  CloudHail,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  Snowflake,
  CloudSunRain,
  CloudMoonRain,
  CloudLightning,
};

/**
 * Renders the Lucide icon that matches a WMO weather code.
 * The icon colour follows the condition (sun = amber, rain = sky, snow = white…).
 */
export default function WeatherIcon({ code, isDay = true, size = 24, className = '', decorative = false }) {
  const { t } = useTranslation();
  const info = getWeatherInfo(code, isDay);
  const Icon = ICONS[info.icon] || CloudSun;
  const label = t(`weather.${info.key}`);
  return (
    <Icon
      size={size}
      strokeWidth={1.75}
      className={`wicon wicon--${info.accent} ${isDay ? '' : 'wicon--night'} ${className}`.trim()}
      aria-hidden={decorative ? 'true' : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
    />
  );
}
