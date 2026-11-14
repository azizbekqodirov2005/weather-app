/**
 * Open-Meteo Geocoding API service.
 * Docs: https://open-meteo.com/en/docs/geocoding-api
 */
import { ApiError, buildUrl, fetchJson } from './apiClient';

export const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';

/** Languages the geocoding API can return localized names in. Uzbek is not
 *  among them, so Uzbek UI falls back to English names (search still matches
 *  Uzbek spellings thanks to the API's alternate-name index). */
const GEOCODING_LANGUAGES = new Set(['en', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'tr', 'hi']);

export function geocodingLanguage(appLanguage) {
  return GEOCODING_LANGUAGES.has(appLanguage) ? appLanguage : 'en';
}

/** Stable identifier for a place, used for favorites de-duplication. */
export function locationId(lat, lon) {
  return `${Number(lat).toFixed(3)},${Number(lon).toFixed(3)}`;
}

export function normalizeGeocodingResult(r) {
  if (!r || typeof r.latitude !== 'number' || typeof r.longitude !== 'number' || typeof r.name !== 'string') {
    return null;
  }
  return {
    id: locationId(r.latitude, r.longitude),
    geoId: typeof r.id === 'number' ? r.id : null,
    name: r.name,
    country: typeof r.country === 'string' ? r.country : '',
    countryCode: typeof r.country_code === 'string' ? r.country_code : '',
    admin1: typeof r.admin1 === 'string' ? r.admin1 : '',
    admin2: typeof r.admin2 === 'string' ? r.admin2 : '',
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: typeof r.timezone === 'string' ? r.timezone : null,
    population: typeof r.population === 'number' ? r.population : null,
    source: 'geocoding',
  };
}

/**
 * Search places by name.
 * @param {string} query
 * @param {{language?: string, count?: number, signal?: AbortSignal}} [options]
 * @returns {Promise<Array>} normalized results (may be empty)
 */
export async function searchCities(query, options = {}) {
  const name = typeof query === 'string' ? query.trim() : '';
  if (name.length < 2) return [];

  const url = buildUrl(GEOCODING_ENDPOINT, {
    name,
    count: options.count ?? 10,
    language: geocodingLanguage(options.language),
    format: 'json',
  });

  const data = await fetchJson(url, { signal: options.signal });
  if (data === null || typeof data !== 'object') throw new ApiError('invalid', 'Malformed geocoding response');
  if (data.error) throw new ApiError('http', typeof data.reason === 'string' ? data.reason : 'Geocoding error');
  // The API omits `results` entirely when nothing matches.
  if (!Array.isArray(data.results)) return [];
  return data.results.map(normalizeGeocodingResult).filter(Boolean);
}
