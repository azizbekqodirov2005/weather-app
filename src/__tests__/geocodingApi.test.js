import { afterEach, describe, expect, it, vi } from 'vitest';
import { geocodingLanguage, locationId, normalizeGeocodingResult, searchCities } from '../services/geocodingApi';
import { normalizeReverseResult } from '../services/reverseGeocodingApi';

describe('geocoding', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('builds a stable id from coordinates (for favorite de-duplication)', () => {
    expect(locationId(41.31115, 69.27972)).toBe('41.311,69.280');
    expect(locationId(41.3113, 69.2798)).toBe(locationId(41.31115, 69.27972));
  });
  it('falls back to English for unsupported geocoding languages (e.g. Uzbek)', () => {
    expect(geocodingLanguage('uz')).toBe('en');
    expect(geocodingLanguage('ru')).toBe('ru');
  });
  it('normalizes results and drops malformed entries', () => {
    expect(normalizeGeocodingResult({ name: 'X' })).toBeNull();
    expect(
      normalizeGeocodingResult({ id: 1, name: 'Tashkent', latitude: 41.26, longitude: 69.22, country: 'Uzbekistan', country_code: 'UZ', admin1: 'Toshkent Shahri' }),
    ).toMatchObject({ name: 'Tashkent', countryCode: 'UZ', admin1: 'Toshkent Shahri', source: 'geocoding' });
  });
  it('returns [] when the API omits `results` and skips requests for short queries', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ generationtime_ms: 1 })));
    vi.stubGlobal('fetch', fetchMock);
    expect(await searchCities('a')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await searchCities('zzzzzz')).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('https://geocoding-api.open-meteo.com/v1/search?name=zzzzzz');
  });
  it('normalizes reverse geocoding results without inventing names', () => {
    expect(normalizeReverseResult({ error: 'Unable to geocode' }, 1, 2)).toBeNull();
    expect(normalizeReverseResult({ address: { town: 'Qoqon', state: 'Fergana', country: 'Uzbekistan', country_code: 'uz' } }, 40.5, 70.9)).toMatchObject({
      name: 'Qoqon',
      admin1: 'Fergana',
      countryCode: 'UZ',
      source: 'reverse',
    });
  });
});
