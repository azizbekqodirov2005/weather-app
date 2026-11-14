import uz from './uz';
import en from './en';
import ru from './ru';

export const LANGUAGES = [
  { code: 'uz', label: 'O‘zbekcha', short: 'UZ' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ru', label: 'Русский', short: 'RU' },
];

export const DEFAULT_LANGUAGE = 'uz';

const DICTIONARIES = { uz, en, ru };

export function isSupportedLanguage(code) {
  return Object.prototype.hasOwnProperty.call(DICTIONARIES, code);
}

function lookup(dict, path) {
  return path.split('.').reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), dict);
}

function interpolate(text, params) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (_, key) => (params[key] !== undefined ? String(params[key]) : `{${key}}`));
}

/**
 * Create a translation function for a language.
 * Falls back to English, then to the key itself, so missing keys are visible
 * during development instead of silently rendering nothing.
 */
export function createTranslator(language) {
  const dict = DICTIONARIES[language] || DICTIONARIES[DEFAULT_LANGUAGE];
  return function t(key, params) {
    const value = lookup(dict, key) ?? lookup(DICTIONARIES.en, key);
    if (typeof value !== 'string') return key;
    return interpolate(value, params);
  };
}

export { DICTIONARIES };
