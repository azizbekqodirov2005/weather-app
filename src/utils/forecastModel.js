import { findCurrentHourIndex } from './dateUtils';

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const at = (arr, i) => (Array.isArray(arr) && i >= 0 && i < arr.length ? num(arr[i]) : null);

/**
 * Turn a raw (validated) Open-Meteo response into a UI-friendly view model.
 * All values stay in base units (°C, km/h, hPa, m); nothing is invented –
 * variables missing from the response become `null`.
 */
export function buildForecastModel(data) {
  if (!data) return null;
  const { current, hourly, daily } = data;
  const nowIndex = findCurrentHourIndex(hourly.time, current.time);
  const isDay = current.is_day === undefined ? true : current.is_day === 1;

  const hourlyItems = hourly.time.slice(nowIndex, nowIndex + 24).map((time, offset) => {
    const i = nowIndex + offset;
    return {
      time,
      temperature: at(hourly.temperature_2m, i),
      apparentTemperature: at(hourly.apparent_temperature, i),
      precipitationProbability: at(hourly.precipitation_probability, i),
      precipitation: at(hourly.precipitation, i),
      weatherCode: at(hourly.weather_code, i),
      windSpeed: at(hourly.wind_speed_10m, i),
      windDirection: at(hourly.wind_direction_10m, i),
      humidity: at(hourly.relative_humidity_2m, i),
      isDay: hourly.is_day ? hourly.is_day[i] === 1 : true,
    };
  });

  const dailyItems = daily.time.map((date, i) => ({
    date,
    weatherCode: at(daily.weather_code, i),
    tempMax: at(daily.temperature_2m_max, i),
    tempMin: at(daily.temperature_2m_min, i),
    precipitationProbability: at(daily.precipitation_probability_max, i),
    precipitationSum: at(daily.precipitation_sum, i),
    windSpeedMax: at(daily.wind_speed_10m_max, i),
    windDirection: at(daily.wind_direction_10m_dominant, i),
    uvIndexMax: at(daily.uv_index_max, i),
    sunrise: Array.isArray(daily.sunrise) ? daily.sunrise[i] ?? null : null,
    sunset: Array.isArray(daily.sunset) ? daily.sunset[i] ?? null : null,
  }));

  const today = dailyItems[0] || {};

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone || null,
    timezoneAbbreviation: data.timezone_abbreviation || null,
    utcOffsetSeconds: num(data.utc_offset_seconds),
    current: {
      time: current.time,
      isDay,
      temperature: num(current.temperature_2m),
      apparentTemperature: num(current.apparent_temperature),
      humidity: num(current.relative_humidity_2m),
      weatherCode: num(current.weather_code),
      cloudCover: num(current.cloud_cover),
      pressure: num(current.surface_pressure),
      pressureMsl: num(current.pressure_msl),
      windSpeed: num(current.wind_speed_10m),
      windDirection: num(current.wind_direction_10m),
      windGusts: num(current.wind_gusts_10m),
      precipitation: num(current.precipitation),
      // hourly-only variables sampled at the current hour
      visibility: at(hourly.visibility, nowIndex),
      uvIndex: at(hourly.uv_index, nowIndex),
      dewPoint: at(hourly.dew_point_2m, nowIndex),
      tempMax: today.tempMax ?? null,
      tempMin: today.tempMin ?? null,
      sunrise: today.sunrise ?? null,
      sunset: today.sunset ?? null,
      uvIndexMax: today.uvIndexMax ?? null,
    },
    hourly: hourlyItems,
    daily: dailyItems,
  };
}
