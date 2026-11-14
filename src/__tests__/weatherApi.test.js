import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildForecastUrl, clearForecastCache, fetchForecast, validateForecastResponse } from '../services/weatherApi';
import { ApiError } from '../services/apiClient';
import { makeForecast } from '../test/fixtures';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('buildForecastUrl', () => {
  it('requests the documented parameters from the official endpoint', () => {
    const url = new URL(buildForecastUrl(41.3111, 69.2797));
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(url.searchParams.get('timezone')).toBe('auto');
    expect(url.searchParams.get('forecast_days')).toBe('7');
    expect(url.searchParams.get('current')).toContain('temperature_2m');
    expect(url.searchParams.get('hourly')).toContain('precipitation_probability');
    expect(url.searchParams.get('hourly')).toContain('uv_index');
    expect(url.searchParams.get('hourly')).toContain('visibility');
    expect(url.searchParams.get('daily')).toContain('sunrise');
    expect(url.searchParams.get('daily')).toContain('temperature_2m_max');
  });
});

describe('validateForecastResponse', () => {
  it('accepts a well-formed response', () => {
    expect(() => validateForecastResponse(makeForecast())).not.toThrow();
  });
  it('rejects malformed responses', () => {
    expect(() => validateForecastResponse(null)).toThrow(ApiError);
    expect(() => validateForecastResponse('x')).toThrow(/not an object/);
    expect(() => validateForecastResponse({ ...makeForecast(), current: null })).toThrow(/current/);
    const bad = makeForecast();
    bad.hourly.temperature_2m = [1, 2];
    expect(() => validateForecastResponse(bad)).toThrow(/inconsistent/);
  });
  it('surfaces API-level errors', () => {
    expect(() => validateForecastResponse({ error: true, reason: 'Latitude must be in range' })).toThrow(/Latitude/);
  });
});

describe('fetchForecast', () => {
  beforeEach(() => {
    clearForecastCache();
    vi.restoreAllMocks();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('rejects invalid coordinates before any network call', async () => {
    const spy = vi.fn();
    vi.stubGlobal('fetch', spy);
    await expect(fetchForecast({ latitude: 95, longitude: 0 })).rejects.toMatchObject({ code: 'coordinates' });
    await expect(fetchForecast({ latitude: 'a', longitude: 0 })).rejects.toMatchObject({ code: 'coordinates' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('maps network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchForecast({ latitude: 41, longitude: 69 })).rejects.toMatchObject({ code: 'network' });
  });

  it('maps HTTP errors with the API reason', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: true, reason: 'Bad params' }, 400)));
    await expect(fetchForecast({ latitude: 41, longitude: 69 })).rejects.toMatchObject({
      code: 'http',
      status: 400,
      message: 'Bad params',
    });
  });

  it('maps malformed JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>', { status: 200 })));
    await expect(fetchForecast({ latitude: 41, longitude: 69 })).rejects.toMatchObject({ code: 'invalid' });
  });

  it('caches and de-duplicates identical requests, and `force` bypasses the cache', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(makeForecast())));
    vi.stubGlobal('fetch', fetchMock);
    const [a, b] = await Promise.all([
      fetchForecast({ latitude: 41.3, longitude: 69.25 }),
      fetchForecast({ latitude: 41.3, longitude: 69.25 }),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a.data.latitude).toBe(41.3);
    expect(b).toBe(a);
    await fetchForecast({ latitude: 41.3, longitude: 69.25 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await fetchForecast({ latitude: 41.3, longitude: 69.25 }, { force: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('supports cancellation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_, { signal }) =>
        new Promise((_, reject) => {
          signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
        }),
      ),
    );
    const controller = new AbortController();
    const p = fetchForecast({ latitude: 41, longitude: 69 }, { signal: controller.signal });
    controller.abort();
    await expect(p).rejects.toMatchObject({ code: 'aborted' });
  });

  it('a new caller never attaches to a request cancelled by an earlier caller (StrictMode / A→B→A switching)', async () => {
    const fetchMock = vi.fn().mockImplementation(
      (_, { signal }) =>
        new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
          setTimeout(() => resolve(jsonResponse(makeForecast())), 5);
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const first = new AbortController();
    const p1 = fetchForecast({ latitude: 41.3, longitude: 69.25 }, { signal: first.signal });
    first.abort(); // e.g. StrictMode effect cleanup
    await expect(p1).rejects.toMatchObject({ code: 'aborted' });
    const second = new AbortController();
    const result = await fetchForecast({ latitude: 41.3, longitude: 69.25 }, { signal: second.signal });
    expect(result.data.latitude).toBe(41.3);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('one subscriber aborting does not cancel the request for other subscribers', async () => {
    const fetchMock = vi.fn().mockImplementation(
      (_, { signal }) =>
        new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
          setTimeout(() => resolve(jsonResponse(makeForecast())), 5);
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const a = new AbortController();
    const b = new AbortController();
    const pa = fetchForecast({ latitude: 41.3, longitude: 69.25 }, { signal: a.signal });
    const pb = fetchForecast({ latitude: 41.3, longitude: 69.25 }, { signal: b.signal });
    a.abort();
    await expect(pa).rejects.toMatchObject({ code: 'aborted' });
    await expect(pb).resolves.toMatchObject({ data: { latitude: 41.3 } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
