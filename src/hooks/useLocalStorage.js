import { useCallback, useEffect, useRef, useState } from 'react';

function readStorage(key, fallback, validate) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return validate && !validate(parsed) ? fallback : parsed;
  } catch {
    return fallback;
  }
}

/**
 * useState persisted to LocalStorage.
 * - Safe when storage is unavailable (private mode, quota, SSR).
 * - Optional `validate` guards against corrupted values.
 * - Syncs between tabs via the `storage` event.
 */
export function useLocalStorage(key, initialValue, validate) {
  const [value, setValue] = useState(() => readStorage(key, initialValue, validate));
  const keyRef = useRef(key);

  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable or full – state still works in-memory */
    }
  }, [key, value]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== keyRef.current || e.storageArea !== window.localStorage) return;
      setValue(readStorage(keyRef.current, initialValue, validate));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // initialValue/validate are intentionally captured once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(keyRef.current);
    } catch {
      /* ignore */
    }
    setValue(initialValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [value, setValue, remove];
}
