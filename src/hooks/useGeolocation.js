import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Browser Geolocation wrapper with explicit, honest states.
 * status: 'idle' | 'locating' | 'success' | 'error'
 * errorCode: 'unsupported' | 'denied' | 'unavailable' | 'timeout' | 'unknown'
 */
export function useGeolocation() {
  const [state, setState] = useState({ status: 'idle', coords: null, errorCode: null });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const locate = useCallback(() => {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        const next = { status: 'error', coords: null, errorCode: 'unsupported' };
        setState(next);
        resolve(next);
        return;
      }
      setState({ status: 'locating', coords: null, errorCode: null });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          const next = { status: 'success', coords, errorCode: null };
          if (mounted.current) setState(next);
          resolve(next);
        },
        (err) => {
          let errorCode = 'unknown';
          if (err && err.code === 1) errorCode = 'denied';
          else if (err && err.code === 2) errorCode = 'unavailable';
          else if (err && err.code === 3) errorCode = 'timeout';
          const next = { status: 'error', coords: null, errorCode };
          if (mounted.current) setState(next);
          resolve(next);
        },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 5 * 60 * 1000 },
      );
    });
  }, []);

  const reset = useCallback(() => setState({ status: 'idle', coords: null, errorCode: null }), []);

  return { ...state, locate, reset };
}
