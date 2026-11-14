import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useWeather } from '../hooks/useWeather';
import { useGeolocation } from '../hooks/useGeolocation';
import { useGeoPermission } from '../hooks/useGeoPermission';
import { reverseGeocode } from '../services/reverseGeocodingApi';
import { locationId } from '../services/geocodingApi';
import { buildForecastModel } from '../utils/forecastModel';
import { useSettings } from './SettingsContext';
import { isLocation } from '../utils/location';

const STORAGE_KEYS = {
  selected: 'skycast:selected-location',
  favorites: 'skycast:favorites',
  recent: 'skycast:recent',
};

const MAX_RECENT = 6;
const ASKED_KEY = 'skycast:location-asked';

function wasAsked() {
  try {
    return window.localStorage.getItem(ASKED_KEY) === '1';
  } catch {
    return false;
  }
}
function markAsked() {
  try {
    window.localStorage.setItem(ASKED_KEY, '1');
  } catch {
    /* ignore */
  }
}
const MAX_FAVORITES = 12;

const isLocationOrNull = (v) => v === null || isLocation(v);
const isLocationList = (v) => Array.isArray(v) && v.every(isLocation);

const WeatherContext = createContext(null);

export function WeatherProvider({ children }) {
  const { language, t } = useSettings();
  const [selected, setSelected] = useLocalStorage(STORAGE_KEYS.selected, null, isLocationOrNull);
  const [favorites, setFavorites] = useLocalStorage(STORAGE_KEYS.favorites, [], isLocationList);
  const [recent, setRecent] = useLocalStorage(STORAGE_KEYS.recent, [], isLocationList);
  const [notice, setNotice] = useState(null); // { type: 'error'|'info'|'success', message }
  const noticeTimer = useRef(null);

  const weather = useWeather(selected);
  const geo = useGeolocation();
  const permission = useGeoPermission();
  const [resolvingLocation, setResolvingLocation] = useState(false);
  // null | 'ask' | 'waiting' | 'denied' | 'insecure' | 'unsupported'
  const [locationSheet, setLocationSheet] = useState(null);

  const model = useMemo(() => (weather.data ? buildForecastModel(weather.data) : null), [weather.data]);

  const showNotice = useCallback((type, message, ttl = 4500) => {
    setNotice({ type, message, id: Date.now() });
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    if (ttl > 0) noticeTimer.current = setTimeout(() => setNotice(null), ttl);
  }, []);
  const dismissNotice = useCallback(() => setNotice(null), []);
  useEffect(() => () => noticeTimer.current && clearTimeout(noticeTimer.current), []);

  const selectLocation = useCallback(
    (loc, { remember = true } = {}) => {
      if (!isLocation(loc)) return;
      setSelected(loc);
      if (remember && loc.source !== 'geolocation') {
        setRecent((prev) => [loc, ...prev.filter((r) => r.id !== loc.id)].slice(0, MAX_RECENT));
      }
    },
    [setSelected, setRecent],
  );

  const isFavorite = useCallback((id) => favorites.some((f) => f.id === id), [favorites]);

  const toggleFavorite = useCallback(
    (loc) => {
      if (!isLocation(loc)) return;
      setFavorites((prev) => {
        const exists = prev.some((f) => f.id === loc.id);
        if (exists) {
          showNotice('info', t('favorites.removed'));
          return prev.filter((f) => f.id !== loc.id);
        }
        showNotice('success', t('favorites.added'));
        return [loc, ...prev].slice(0, MAX_FAVORITES);
      });
    },
    [setFavorites, showNotice, t],
  );

  const removeFavorite = useCallback(
    (id) => setFavorites((prev) => prev.filter((f) => f.id !== id)),
    [setFavorites],
  );

  const clearRecent = useCallback(() => setRecent([]), [setRecent]);

  const { locate } = geo;

  /**
   * Geolocate → show weather immediately → resolve a readable name (best effort).
   * A blocked permission opens the in-app guide instead of a dead-end toast.
   */
  const runLocate = useCallback(async () => {
    const result = await locate();
    if (result.status !== 'success') {
      if (result.errorCode === 'denied') setLocationSheet('denied');
      else if (result.errorCode === 'unsupported') setLocationSheet('unsupported');
      else {
        setLocationSheet(null);
        showNotice('error', t(`location.${result.errorCode || 'unknownError'}`), 7000);
      }
      return false;
    }
    setLocationSheet(null);
    const { latitude, longitude } = result.coords;
    const base = {
      id: locationId(latitude, longitude),
      geoId: null,
      name: t('location.label'),
      country: '',
      countryCode: '',
      admin1: '',
      admin2: '',
      latitude,
      longitude,
      timezone: null,
      population: null,
      source: 'geolocation',
      isCurrentLocation: true,
    };
    // Show weather immediately with a generic label, then upgrade the name.
    selectLocation(base, { remember: false });
    setResolvingLocation(true);
    try {
      const place = await reverseGeocode({ latitude, longitude }, { language });
      if (place) {
        selectLocation({ ...place, id: base.id, source: 'geolocation', isCurrentLocation: true }, { remember: false });
      } else {
        showNotice('info', t('location.resolvedFallback'), 6000);
      }
    } catch {
      showNotice('info', t('location.resolvedFallback'), 6000);
    } finally {
      setResolvingLocation(false);
    }
    return true;
  }, [locate, language, selectLocation, showNotice, t]);

  /** "My location" button: explain first (in-app), then ask the browser. */
  const useMyLocation = useCallback(() => {
    switch (permission) {
      case 'insecure':
      case 'unsupported':
      case 'denied':
        setLocationSheet(permission);
        return;
      case 'prompt':
        setLocationSheet('ask');
        return;
      default:
        // 'granted', 'checking' or 'unknown' (no Permissions API): just try.
        runLocate();
    }
  }, [permission, runLocate]);

  /** "Allow" inside the in-app sheet → triggers the browser's native permission dialog. */
  const allowLocation = useCallback(() => {
    setLocationSheet('waiting');
    runLocate();
  }, [runLocate]);

  const closeLocationSheet = useCallback(() => {
    markAsked();
    setLocationSheet(null);
  }, []);

  // The user re-enabled location in browser/OS settings while the guide is open
  // (or the permission was granted from elsewhere): continue automatically.
  const lastPermission = useRef(permission);
  useEffect(() => {
    const previous = lastPermission.current;
    lastPermission.current = permission;
    if (permission === 'granted' && previous !== 'granted' && previous !== 'checking' && locationSheet) {
      queueMicrotask(() => runLocate());
    }
  }, [permission, locationSheet, runLocate]);

  // First launch without a chosen city: locate automatically when allowed,
  // otherwise offer the in-app permission sheet once.
  const firstRunHandled = useRef(false);
  useEffect(() => {
    if (firstRunHandled.current || selected || permission === 'checking') return;
    firstRunHandled.current = true;
    if (permission === 'granted') {
      queueMicrotask(() => runLocate());
    } else if ((permission === 'prompt' || permission === 'unknown') && !wasAsked()) {
      markAsked();
      queueMicrotask(() => setLocationSheet('ask'));
    }
  }, [permission, selected, runLocate]);

  const value = useMemo(
    () => ({
      selected,
      selectLocation,
      favorites,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      recent,
      clearRecent,
      weather,
      model,
      geo,
      resolvingLocation,
      useMyLocation,
      permission,
      locationSheet,
      allowLocation,
      closeLocationSheet,
      notice,
      showNotice,
      dismissNotice,
    }),
    [
      selected,
      selectLocation,
      favorites,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      recent,
      clearRecent,
      weather,
      model,
      geo,
      resolvingLocation,
      useMyLocation,
      permission,
      locationSheet,
      allowLocation,
      closeLocationSheet,
      notice,
      showNotice,
      dismissNotice,
    ],
  );

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export function useWeatherContext() {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeatherContext must be used within WeatherProvider');
  return ctx;
}
