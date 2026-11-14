import { useEffect, useState } from 'react';

/**
 * Live geolocation permission state.
 * 'granted' | 'prompt' | 'denied' | 'checking' (query pending) |
 * 'unknown' (Permissions API missing or it rejected the query) |
 * 'insecure' (http:// page – browsers refuse geolocation) | 'unsupported'
 *
 * The `change` listener lets the app react the moment the user re-enables
 * location in the browser/OS settings.
 */
export function useGeoPermission() {
  const [state, setState] = useState(() => initialState());

  useEffect(() => {
    if (state === 'insecure' || state === 'unsupported') return undefined;
    if (!navigator.permissions?.query) return undefined;
    let status;
    let cancelled = false;
    const onChange = () => setState(status.state);
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((s) => {
        if (cancelled) return;
        status = s;
        setState(s.state);
        s.addEventListener('change', onChange);
      })
      .catch(() => {
        // some browsers reject the query: we simply cannot know in advance
        if (!cancelled) setState('unknown');
      });
    return () => {
      cancelled = true;
      status?.removeEventListener('change', onChange);
    };
    // the permission source does not change during the session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}

function initialState() {
  if (typeof window === 'undefined') return 'unknown';
  if (!('geolocation' in navigator)) return 'unsupported';
  if (window.isSecureContext === false) return 'insecure';
  return navigator.permissions?.query ? 'checking' : 'unknown';
}
