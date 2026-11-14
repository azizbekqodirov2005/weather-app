import { describe, expect, it } from 'vitest';
import {
  findCurrentHourIndex,
  formatLongDate,
  formatRelativeTime,
  formatShortDate,
  formatTime,
  formatWeekday,
  parseLocalIso,
} from '../utils/dateUtils';

describe('dateUtils', () => {
  it('parses location-local ISO strings without time-zone shifting', () => {
    const d = parseLocalIso('2026-11-13T11:00');
    expect(d.getUTCHours()).toBe(11);
    expect(formatTime('2026-11-13T11:00', 'uz')).toMatch(/11:00/);
    expect(formatTime('2026-11-13T23:30', 'en')).toMatch(/11:30/);
    expect(parseLocalIso('garbage')).toBeNull();
    expect(formatTime(null, 'uz')).toBe('—');
  });
  it('finds the current hourly slot', () => {
    const times = ['2026-11-13T09:00', '2026-11-13T10:00', '2026-11-13T11:00', '2026-11-13T12:00'];
    expect(findCurrentHourIndex(times, '2026-11-13T11:15')).toBe(2);
    expect(findCurrentHourIndex(times, '2026-11-13T08:00')).toBe(0);
    expect(findCurrentHourIndex([], '2026-11-13T08:00')).toBe(0);
  });
  it('formats weekdays per language', () => {
    expect(formatWeekday('2026-11-13', 'en', 'long')).toBe('Friday');
    expect(formatWeekday('2026-11-13', 'ru', 'long')).toBe('пятница');
  });
  it('formats relative time', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 5 * 60 * 1000, 'en', now)).toMatch(/5 minutes ago/);
  });

  it('formats Uzbek dates from explicit tables (no dependence on browser CLDR data)', () => {
    expect(formatWeekday('2026-11-13', 'uz', 'long')).toBe('Juma');
    expect(formatWeekday('2026-11-15', 'uz', 'short')).toBe('Yak');
    expect(formatShortDate('2026-11-13', 'uz')).toBe('13-noy');
    expect(formatLongDate('2026-11-13T16:15', 'uz')).toBe('Juma, 13-noyabr');
    expect(formatLongDate('2026-01-05', 'uz')).toBe('Dushanba, 5-yanvar');
    expect(formatShortDate('bad', 'uz')).toBe('—');
  });
  it('formats Uzbek relative time', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 10 * 1000, 'uz', now)).toBe('hozirgina');
    expect(formatRelativeTime(now - 5 * 60 * 1000, 'uz', now)).toBe('5 daqiqa oldin');
    expect(formatRelativeTime(now - 2 * 3600 * 1000, 'uz', now)).toBe('2 soat oldin');
  });
});
