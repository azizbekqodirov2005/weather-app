/**
 * Reverse geocoding for the "My location" feature.
 *
 * Open-Meteo does not offer reverse geocoding, so we use the public
 * OpenStreetMap Nominatim service (free, no API key, attribution required —
 * see the footer). If it fails the caller falls back to showing coordinates;
 * we never fabricate a city name.
 * Usage policy: https://operations.osmfoundation.org/policies/nominatim/
 */
import { assertValidCoordinates, buildUrl, fetchJson } from './apiClient';
import { locationId } from './geocodingApi';

export const REVERSE_GEOCODING_ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';

export function normalizeReverseResult(data, latitude, longitude) {
  if (!data || typeof data !== 'object' || data.error) return null;
  const a = data.address || {};
  const name = a.city || a.town || a.village || a.municipality || a.county || a.state_district || a.state || data.name;
  if (typeof name !== 'string' || !name) return null;
  return {
    id: locationId(latitude, longitude),
    geoId: null,
    name,
    country: typeof a.country === 'string' ? a.country : '',
    countryCode: typeof a.country_code === 'string' ? a.country_code.toUpperCase() : '',
    admin1: typeof a.state === 'string' && a.state !== name ? a.state : '',
    admin2: '',
    latitude,
    longitude,
    timezone: null,
    population: null,
    source: 'reverse',
  };
}

/**
 * @param {{latitude:number, longitude:number}} coords
 * @param {{language?: string, signal?: AbortSignal}} [options]
 * @returns {Promise<object|null>} normalized place or null when unresolved
 */
export async function reverseGeocode(coords, options = {}) {
  const { latitude, longitude } = assertValidCoordinates(coords?.latitude, coords?.longitude);
  const url = buildUrl(REVERSE_GEOCODING_ENDPOINT, {
    lat: latitude.toFixed(5),
    lon: longitude.toFixed(5),
    format: 'jsonv2',
    zoom: 10,
    'accept-language': options.language || 'en',
  });
  const data = await fetchJson(url, { signal: options.signal });
  return normalizeReverseResult(data, latitude, longitude);
}
