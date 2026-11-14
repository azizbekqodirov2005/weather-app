/**
 * Date helpers.
 *
 * Open-Meteo (with `timezone=auto`) returns ISO-like local timestamps WITHOUT an
 * offset, e.g. "2026-11-13T11:00". They are already in the location's local time,
 * so we must NOT let the browser shift them into the user's time zone.
 * We parse them as if they were UTC and always format with `timeZone: 'UTC'`.
 */

export const LOCALE_BY_LANGUAGE = {
  uz: 'uz-Latn-UZ',
  en: 'en-US',
  ru: 'ru-RU',
};

/**
 * Many browsers (e.g. Chrome on Windows) ship without Uzbek CLDR data and fall
 * back to output such as "M11 13, Fri". Uzbek date parts are therefore
 * formatted from these explicit tables instead of Intl.
 */
const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const UZ_MONTHS_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
const UZ_WEEKDAYS = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'];
const UZ_WEEKDAYS_SHORT = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];

const capitalize = (str) => (str ? str[0].toUpperCase() + str.slice(1) : str);
const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());

const ISO_LOCAL = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/;

/** Parse "YYYY-MM-DDTHH:mm" (location-local) into a Date whose UTC fields equal the local fields. */
export function parseLocalIso(value) {
  if (typeof value !== 'string') return null;
  const m = ISO_LOCAL.exec(value);
  if (!m) return null;
  const [, y, mo, d, h = '0', mi = '0', s = '0'] = m;
  const date = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
  return Number.isNaN(date.getTime()) ? null : date;
}

function safeFormat(date, language, options) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '—';
  const locale = LOCALE_BY_LANGUAGE[language] || LOCALE_BY_LANGUAGE.en;
  try {
    return new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...options }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...options }).format(date);
  }
}

/** "11:00" / "11:00 AM" depending on locale. */
export function formatTime(localIso, language) {
  const d = typeof localIso === 'string' ? parseLocalIso(localIso) : localIso;
  return safeFormat(d, language, { hour: '2-digit', minute: '2-digit', hour12: language === 'en' });
}

/** Weekday, e.g. "Juma" / "Friday" / "пятница" (style 'long') or "Jum" / "Fri" / "пт" ('short'). */
export function formatWeekday(localIso, language, style = 'short') {
  const d = typeof localIso === 'string' ? parseLocalIso(localIso) : localIso;
  if (language === 'uz') {
    if (!isValidDate(d)) return '—';
    return style === 'long' ? capitalize(UZ_WEEKDAYS[d.getUTCDay()]) : UZ_WEEKDAYS_SHORT[d.getUTCDay()];
  }
  return safeFormat(d, language, { weekday: style });
}

/** "13-noy" / "Nov 13" / "13 нояб." style date. */
export function formatShortDate(localIso, language) {
  const d = typeof localIso === 'string' ? parseLocalIso(localIso) : localIso;
  if (language === 'uz') {
    if (!isValidDate(d)) return '—';
    return `${d.getUTCDate()}-${UZ_MONTHS_SHORT[d.getUTCMonth()]}`;
  }
  return safeFormat(d, language, { day: 'numeric', month: 'short' });
}

/** "Juma, 13-noyabr" / "Friday, November 13" / "пятница, 13 ноября" */
export function formatLongDate(localIso, language) {
  const d = typeof localIso === 'string' ? parseLocalIso(localIso) : localIso;
  if (language === 'uz') {
    if (!isValidDate(d)) return '—';
    return `${capitalize(UZ_WEEKDAYS[d.getUTCDay()])}, ${d.getUTCDate()}-${UZ_MONTHS[d.getUTCMonth()]}`;
  }
  return safeFormat(d, language, { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Compare the date part of two location-local ISO strings. */
export function isSameLocalDay(a, b) {
  return typeof a === 'string' && typeof b === 'string' && a.slice(0, 10) === b.slice(0, 10);
}

/**
 * Index of the first hourly entry that is >= `currentIso` (same hour or later).
 * Falls back to 0 when nothing matches.
 */
export function findCurrentHourIndex(hourlyTimes, currentIso) {
  if (!Array.isArray(hourlyTimes) || hourlyTimes.length === 0) return 0;
  const current = parseLocalIso(currentIso);
  if (!current) return 0;
  // Truncate current time to the hour so "11:15" matches the "11:00" slot.
  const hourStart = new Date(current);
  hourStart.setUTCMinutes(0, 0, 0);
  for (let i = 0; i < hourlyTimes.length; i += 1) {
    const t = parseLocalIso(hourlyTimes[i]);
    if (t && t.getTime() >= hourStart.getTime()) return i;
  }
  return 0;
}

/** Relative "x minutes ago" style text for the last-updated indicator. */
export function formatRelativeTime(timestampMs, language, nowMs = Date.now()) {
  if (typeof timestampMs !== 'number') return '—';
  const diffSec = Math.max(0, Math.round((nowMs - timestampMs) / 1000));
  const diffMin = Math.round(diffSec / 60);
  const diffH = Math.round(diffMin / 60);
  const diffD = Math.round(diffH / 24);

  if (language === 'uz') {
    if (diffSec < 60) return 'hozirgina';
    if (diffMin < 60) return `${diffMin} daqiqa oldin`;
    if (diffH < 24) return `${diffH} soat oldin`;
    return `${diffD} kun oldin`;
  }

  const locale = LOCALE_BY_LANGUAGE[language] || 'en-US';
  let rtf;
  try {
    rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  } catch {
    rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
  }
  if (diffSec < 60) return rtf.format(0, 'second');
  if (diffMin < 60) return rtf.format(-diffMin, 'minute');
  if (diffH < 24) return rtf.format(-diffH, 'hour');
  return rtf.format(-diffD, 'day');
}

/** Clock time of a real timestamp in the user's own time zone (for "last updated"). */
export function formatClock(timestampMs, language) {
  if (typeof timestampMs !== 'number') return '—';
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-US';
  try {
    return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(timestampMs));
  } catch {
    return new Date(timestampMs).toLocaleTimeString();
  }
}
