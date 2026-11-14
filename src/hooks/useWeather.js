import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchForecast } from '../services/weatherApi';
import { isAbortError } from '../services/apiClient';

const IDLE = { key: null, status: 'idle', data: null, error: null, fetchedAt: null };

export function locationKey(loc) {
  return loc ? `${loc.latitude},${loc.longitude}` : null;
}

/**
 * Loads the forecast for a location.
 *
 * - The in-flight request is cancelled when the location changes (rapid city switching).
 * - `refresh`/`retry` bypass the service cache and keep stale data visible while reloading.
 * - Loading state for a *new* location is derived during render (state is keyed by
 *   location), so no synchronous setState happens inside effects.
 *
 * status: 'idle' | 'loading' | 'success' | 'error'
 */
export function useWeather(location) {
  const [state, setState] = useState(IDLE);
  const controllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const key = locationKey(location);

  /** Start a request; state is only touched from promise callbacks (never synchronously). */
  const run = useCallback((loc, { force = false } = {}) => {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const requestId = ++requestIdRef.current;
    const k = locationKey(loc);

    fetchForecast({ latitude: loc.latitude, longitude: loc.longitude }, { signal: controller.signal, force }).then(
      (result) => {
        if (requestId !== requestIdRef.current) return;
        setState({ key: k, status: 'success', data: result.data, error: null, fetchedAt: result.fetchedAt });
      },
      (err) => {
        if (requestId !== requestIdRef.current) return;
        // Our own cancellation (city switched / unmounted): ignore silently.
        if (isAbortError(err) && controller.signal.aborted) return;
        // Anything else – including an abort we did not cause – must surface,
        // otherwise the UI would stay in the loading state forever.
        setState({ key: k, status: 'error', data: null, error: err, fetchedAt: null });
      },
    );
  }, []);

  useEffect(() => {
    if (!location) return undefined;
    run(location);
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [location, run]);

  const refresh = useCallback(() => {
    if (!location) return;
    // Event-driven: keep the previous data visible while the new request runs.
    setState((prev) => (prev.key === key ? { ...prev, status: 'loading', error: null } : prev));
    run(location, { force: true });
  }, [location, key, run]);

  // Derive the visible state: anything stored for another location is stale.
  let visible;
  if (!location) visible = IDLE;
  else if (state.key === key) visible = state;
  else visible = { key, status: 'loading', data: null, error: null, fetchedAt: null };

  return { status: visible.status, data: visible.data, error: visible.error, fetchedAt: visible.fetchedAt, refresh, retry: refresh };
}
