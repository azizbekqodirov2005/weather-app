import { describe, expect, it } from 'vitest';
import { getWeatherInfo, isKnownWeatherCode, SUPPORTED_WEATHER_CODES } from '../utils/weatherCodes';
import { DICTIONARIES } from '../i18n';

const OFFICIAL = [0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 97, 99];

describe('WMO weather codes', () => {
  it('covers every official Open-Meteo code', () => {
    OFFICIAL.forEach((c) => expect(isKnownWeatherCode(c)).toBe(true));
    expect(SUPPORTED_WEATHER_CODES.sort((a, b) => a - b)).toEqual(OFFICIAL);
  });
  it('maps codes deterministically with day/night icons', () => {
    expect(getWeatherInfo(0, true)).toMatchObject({ key: 'clearSky', icon: 'Sun', group: 'clear', known: true });
    expect(getWeatherInfo(0, false).icon).toBe('Moon');
    expect(getWeatherInfo(2, false).icon).toBe('CloudMoon');
    expect(getWeatherInfo(95).group).toBe('storm');
    expect(getWeatherInfo(71).group).toBe('snow');
    expect(getWeatherInfo(getWeatherInfo(63).code).key).toBe('moderateRain');
  });
  it('never crashes on unknown input and flags it as unknown', () => {
    expect(getWeatherInfo(123)).toMatchObject({ key: 'unknown', known: false, code: 123 });
    expect(getWeatherInfo(null)).toMatchObject({ key: 'unknown', known: false, code: null });
    expect(getWeatherInfo('2')).toMatchObject({ known: false });
  });
  it('has a translation for every code in every language', () => {
    Object.entries(DICTIONARIES).forEach(([lang, dict]) => {
      OFFICIAL.forEach((c) => {
        const { key } = getWeatherInfo(c);
        expect(typeof dict.weather[key], `${lang}.weather.${key}`).toBe('string');
      });
    });
  });
});
