/**
 * Open-Meteo Forecast API service.
 * Docs: https://open-meteo.com/en/docs
 *
 * The API is requested in base metric units (°C, km/h, hPa, m) and all unit
 * conversion happens in the UI layer (see utils/conversions.js).
 */
import { ApiError, assertValidCoordinates, buildUrl, fetchJson } from './apiClient';

export const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

export const CURRENT_VARIABLES = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'is_day',
  'precipitation',
  'weather_code',
  'cloud_cover',
  'surface_pressure',
  'pressure_msl',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
];

export const HOURLY_VARIABLES = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'precipitation_probability',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
  'surface_pressure',
  'cloud_cover',
  'visibility',
  'uv_index',
  'dew_point_2m',
  'is_day',
];

export const DAILY_VARIABLES = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'apparent_temperature_min',
  'sunrise',
  'sunset',
  'uv_index_max',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'wind_direction_10m_dominant',
];

export function buildForecastUrl(latitude, longitude) {
  return buildUrl(FORECAST_ENDPOINT, {
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    current: CURRENT_VARIABLES,
    hourly: HOURLY_VARIABLES,
    daily: DAILY_VARIABLES,
    timezone: 'auto',
    forecast_days: 7,
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
    timeformat: 'iso8601',
  });
}

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function arraysSameLength(block, keys) {
  const len = block.time.length;
  return keys.every((k) => !(k in block) || (Array.isArray(block[k]) && block[k].length === len));
}

/**
 * Validate the shape of an Open-Meteo forecast response.
 * Throws ApiError('invalid') when anything required is missing.
 */
export function validateForecastResponse(data) {
  if (!isObject(data)) throw new ApiError('invalid', 'Response is not an object');
  if (data.error) throw new ApiError('http', typeof data.reason === 'string' ? data.reason : 'API error');

  if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
    throw new ApiError('invalid', 'Missing coordinates in response');
  }
  if (!isObject(data.current) || typeof data.current.time !== 'string') {
    throw new ApiError('invalid', 'Missing current block');
  }
  if (typeof data.current.temperature_2m !== 'number') {
    throw new ApiError('invalid', 'Missing current temperature');
  }
  if (!isObject(data.hourly) || !Array.isArray(data.hourly.time) || data.hourly.time.length === 0) {
    throw new ApiError('invalid', 'Missing hourly block');
  }
  if (!arraysSameLength(data.hourly, HOURLY_VARIABLES)) {
    throw new ApiError('invalid', 'Hourly arrays are inconsistent');
  }
  if (!isObject(data.daily) || !Array.isArray(data.daily.time) || data.daily.time.length === 0) {
    throw new ApiError('invalid', 'Missing daily block');
  }
  if (!arraysSameLength(data.daily, DAILY_VARIABLES)) {
    throw new ApiError('invalid', 'Daily arrays are inconsistent');
  }
  return data;
}

/** Simple in-memory cache + in-flight de-duplication keyed by rounded coordinates. */
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();
const inflight = new Map();

export function cacheKey(latitude, longitude) {
  return `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
}

export function clearForecastCache() {
  cache.clear();
  inflight.clear();
}

/**
 * Fetch the forecast for a coordinate.
 *
 * Identical concurrent requests share one network call. Each caller keeps its
 * own AbortSignal: aborting only detaches that caller, and the shared network
 * request is cancelled (and removed from the in-flight map *synchronously*)
 * only once every subscriber has left. This guarantees a later caller never
 * attaches to a request that is already being cancelled.
 *
 * @param {{latitude:number, longitude:number}} coords
 * @param {{signal?: AbortSignal, force?: boolean}} [options]
 * @returns {Promise<{data: object, fetchedAt: number}>}
 */
export async function fetchForecast(coords, options = {}) {
  const { latitude, longitude } = assertValidCoordinates(coords?.latitude, coords?.longitude);
  const key = cacheKey(latitude, longitude);
  const { signal } = options;

  if (signal?.aborted) throw new ApiError('aborted', 'Request aborted');

  if (!options.force) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached;
  }

  let entry = options.force ? null : inflight.get(key);
  if (!entry || entry.controller.signal.aborted) {
    entry = startRequest(key, latitude, longitude);
  }
  return subscribe(entry, signal);
}

function startRequest(key, latitude, longitude) {
  const controller = new AbortController();
  const entry = { controller, subscribers: 0, promise: null };
  entry.promise = (async () => {
    try {
      const raw = await fetchJson(buildForecastUrl(latitude, longitude), { signal: controller.signal });
      const data = validateForecastResponse(raw);
      const result = { data, fetchedAt: Date.now() };
      cache.set(key, result);
      return result;
    } finally {
      if (inflight.get(key) === entry) inflight.delete(key);
    }
  })();
  // Avoid "unhandled rejection" noise when every subscriber has detached.
  entry.promise.catch(() => {});
  inflight.set(key, entry);
  return entry;
}

function subscribe(entry, signal) {
  entry.subscribers += 1;
  let settled = false;

  const leave = () => {
    entry.subscribers -= 1;
    if (entry.subscribers <= 0 && !entry.controller.signal.aborted) {
      // Last subscriber gone: drop it from the shared map first, then cancel.
      for (const [k, v] of inflight) if (v === entry) inflight.delete(k);
      entry.controller.abort();
    }
  };

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      if (settled) return;
      settled = true;
      leave();
      reject(new ApiError('aborted', 'Request aborted'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    entry.promise.then(
      (v) => {
        if (settled) return;
        settled = true;
        entry.subscribers -= 1;
        signal?.removeEventListener('abort', onAbort);
        resolve(v);
      },
      (e) => {
        if (settled) return;
        settled = true;
        entry.subscribers -= 1;
        signal?.removeEventListener('abort', onAbort);
        reject(e);
      },
    );
  });
}
