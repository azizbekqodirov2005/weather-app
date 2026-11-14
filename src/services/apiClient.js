/**
 * Shared low-level HTTP helper used by every service.
 * Produces typed `ApiError`s so the UI can show precise, translatable messages.
 */

export class ApiError extends Error {
  /**
   * @param {'network'|'http'|'invalid'|'aborted'|'coordinates'} code
   * @param {string} message
   * @param {{status?:number, cause?:unknown}} [extra]
   */
  constructor(code, message, extra = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = extra.status;
    this.cause = extra.cause;
  }
}

export function isAbortError(err) {
  return (err && err.name === 'AbortError') || (err instanceof ApiError && err.code === 'aborted');
}

export function buildUrl(base, params) {
  const url = new URL(base);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    url.searchParams.set(k, Array.isArray(v) ? v.join(',') : String(v));
  });
  return url.toString();
}

/**
 * fetch + JSON parse with uniform error mapping.
 * @param {string} url
 * @param {{signal?: AbortSignal, headers?: Record<string,string>}} [options]
 */
export async function fetchJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, { signal: options.signal, headers: options.headers });
  } catch (err) {
    if (err && err.name === 'AbortError') throw new ApiError('aborted', 'Request aborted', { cause: err });
    throw new ApiError('network', 'Network request failed', { cause: err });
  }

  if (!response.ok) {
    let reason = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      if (body && typeof body.reason === 'string') reason = body.reason;
    } catch {
      /* body is not JSON – keep generic reason */
    }
    throw new ApiError('http', reason, { status: response.status });
  }

  try {
    return await response.json();
  } catch (err) {
    throw new ApiError('invalid', 'Malformed JSON response', { cause: err });
  }
}

export function assertValidCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new ApiError('coordinates', `Invalid coordinates: ${latitude}, ${longitude}`);
  }
  return { latitude: lat, longitude: lon };
}
