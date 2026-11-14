/**
 * Unit conversions. The API is always requested in metric base units
 * (°C, km/h, hPa, metres) and converted client-side so that unit switches
 * are instant and do not require another request.
 */

export const TEMPERATURE_UNITS = ['celsius', 'fahrenheit'];
export const WIND_UNITS = ['kmh', 'ms', 'mph'];
export const PRESSURE_UNITS = ['hpa', 'mmhg'];

const HPA_TO_MMHG = 0.75006157584566;
const KMH_TO_MS = 1 / 3.6;
const KMH_TO_MPH = 0.621371192237334;
const KM_TO_MI = 0.621371192237334;

function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

export function roundTo(value, decimals = 0) {
  if (!isNum(value)) return null;
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

// ---- Temperature -----------------------------------------------------------

export function celsiusToFahrenheit(c) {
  return isNum(c) ? (c * 9) / 5 + 32 : null;
}

export function fahrenheitToCelsius(f) {
  return isNum(f) ? ((f - 32) * 5) / 9 : null;
}

export function convertTemperature(celsius, unit) {
  if (!isNum(celsius)) return null;
  return unit === 'fahrenheit' ? celsiusToFahrenheit(celsius) : celsius;
}

export function temperatureSymbol(unit) {
  return unit === 'fahrenheit' ? '°F' : '°C';
}

export function formatTemperature(celsius, unit, { decimals = 0, withUnit = true } = {}) {
  const v = roundTo(convertTemperature(celsius, unit), decimals);
  if (v === null) return '—';
  // avoid "-0"
  const normalized = Object.is(v, -0) ? 0 : v;
  return withUnit ? `${normalized}${temperatureSymbol(unit)}` : `${normalized}°`;
}

// ---- Wind ------------------------------------------------------------------

export function kmhToMs(v) {
  return isNum(v) ? v * KMH_TO_MS : null;
}

export function kmhToMph(v) {
  return isNum(v) ? v * KMH_TO_MPH : null;
}

export function convertWindSpeed(kmh, unit) {
  if (!isNum(kmh)) return null;
  switch (unit) {
    case 'ms':
      return kmhToMs(kmh);
    case 'mph':
      return kmhToMph(kmh);
    default:
      return kmh;
  }
}

export function windUnitLabel(unit, t) {
  const fallback = { kmh: 'km/h', ms: 'm/s', mph: 'mph' };
  if (typeof t === 'function') return t(`units.wind.${unit}`) || fallback[unit] || fallback.kmh;
  return fallback[unit] || fallback.kmh;
}

export function formatWindSpeed(kmh, unit, t) {
  const v = roundTo(convertWindSpeed(kmh, unit), unit === 'ms' ? 1 : 0);
  if (v === null) return '—';
  return `${v} ${windUnitLabel(unit, t)}`;
}

/** 16-point compass direction from degrees (meteorological: direction wind comes FROM). */
export function degreesToCompass(deg) {
  if (!isNum(deg)) return null;
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const normalized = ((deg % 360) + 360) % 360;
  return dirs[Math.round(normalized / 22.5) % 16];
}

// ---- Pressure --------------------------------------------------------------

export function hpaToMmHg(hpa) {
  return isNum(hpa) ? hpa * HPA_TO_MMHG : null;
}

export function convertPressure(hpa, unit) {
  if (!isNum(hpa)) return null;
  return unit === 'mmhg' ? hpaToMmHg(hpa) : hpa;
}

export function pressureUnitLabel(unit, t) {
  const fallback = { hpa: 'hPa', mmhg: 'mmHg' };
  if (typeof t === 'function') return t(`units.pressure.${unit}`) || fallback[unit] || fallback.hpa;
  return fallback[unit] || fallback.hpa;
}

export function formatPressure(hpa, unit, t) {
  const v = roundTo(convertPressure(hpa, unit), 0);
  if (v === null) return '—';
  return `${v} ${pressureUnitLabel(unit, t)}`;
}

// ---- Distance / visibility -------------------------------------------------

/** Visibility comes from the API in metres. Shown in km (or miles for mph users). */
export function formatVisibility(metres, windUnit, t) {
  if (!isNum(metres)) return '—';
  const imperial = windUnit === 'mph';
  if (imperial) {
    const mi = (metres / 1000) * KM_TO_MI;
    return `${roundTo(mi, mi < 10 ? 1 : 0)} ${t ? t('units.distance.mi') : 'mi'}`;
  }
  if (metres < 1000) return `${Math.round(metres)} ${t ? t('units.distance.m') : 'm'}`;
  const km = metres / 1000;
  return `${roundTo(km, km < 10 ? 1 : 0)} ${t ? t('units.distance.km') : 'km'}`;
}

// ---- Misc ------------------------------------------------------------------

export function formatPercent(v) {
  return isNum(v) ? `${Math.round(v)}%` : '—';
}

export function uvCategoryKey(uv) {
  if (!isNum(uv)) return null;
  if (uv < 3) return 'low';
  if (uv < 6) return 'moderate';
  if (uv < 8) return 'high';
  if (uv < 11) return 'veryHigh';
  return 'extreme';
}
