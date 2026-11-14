import { describe, expect, it } from 'vitest';
import { createTranslator, DICTIONARIES, isSupportedLanguage, DEFAULT_LANGUAGE } from '../i18n';

function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe('i18n', () => {
  it('defaults to Uzbek', () => {
    expect(DEFAULT_LANGUAGE).toBe('uz');
    expect(isSupportedLanguage('uz')).toBe(true);
    expect(isSupportedLanguage('fr')).toBe(false);
  });
  it('every language has exactly the same key set', () => {
    const en = flatten(DICTIONARIES.en).sort();
    expect(flatten(DICTIONARIES.uz).sort()).toEqual(en);
    expect(flatten(DICTIONARIES.ru).sort()).toEqual(en);
  });
  it('translates and interpolates', () => {
    const t = createTranslator('uz');
    expect(t('nav.refresh')).toBe('Yangilash');
    expect(t('search.noResults', { query: 'Qoqon' })).toContain('Qoqon');
    expect(createTranslator('ru')('settings.dark')).not.toBe(createTranslator('en')('settings.dark'));
  });
  it('falls back to the key when missing', () => {
    expect(createTranslator('en')('does.not.exist')).toBe('does.not.exist');
  });
});
