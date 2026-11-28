import { describe, expect, it } from 'vitest';
import { DICTIONARIES, fill, isLanguage, LANGUAGES, LANGUAGE_NAMES, stringsFor, textDirection, type Strings } from './i18n';

const keys = Object.keys(DICTIONARIES.en) as (keyof Strings)[];

describe('interface languages', () => {
  it('offers the languages families asked for', () => {
    for (const code of ['en', 'de', 'es', 'fr']) expect(LANGUAGES).toContain(code);
    expect(LANGUAGES.length).toBeGreaterThanOrEqual(16);
  });
  it('gives every language a complete dictionary with no empty wording', () => {
    for (const code of LANGUAGES) {
      const dictionary = DICTIONARIES[code];
      expect(Object.keys(dictionary).sort()).toEqual([...keys].sort());
      for (const key of keys) expect(dictionary[key].trim().length).toBeGreaterThan(0);
    }
  });
  it('names each language in its own script', () => {
    expect(LANGUAGE_NAMES.de).toBe('Deutsch');
    expect(LANGUAGE_NAMES.ja).toBe('日本語');
    expect(Object.keys(LANGUAGE_NAMES).sort()).toEqual([...LANGUAGES].sort());
  });
  it('fills placeholders in the family language without dropping the reminder', () => {
    expect(fill(stringsFor('de').prepInMinutes, { n: 8, title: 'Tablette nehmen' })).toBe('In 8 Minuten: Tablette nehmen');
    expect(fill(stringsFor('fr').stepOf, { step: 2, total: 3 })).toBe('2 sur 3');
    expect(fill('Keep {name} safe', { name: 'Anna' })).toBe('Keep Anna safe');
    expect(fill('No value here', {})).toBe('No value here');
  });
  it('falls back to English instead of showing a raw key', () => {
    expect(stringsFor('klingon').navToday).toBe('Today');
    expect(stringsFor(undefined).navToday).toBe('Today');
    expect(isLanguage('de')).toBe(true);
    expect(isLanguage('xx')).toBe(false);
  });
  it('writes right-to-left only for the languages that need it', () => {
    expect(textDirection('ar')).toBe('rtl');
    expect(textDirection('en')).toBe('ltr');
    expect(textDirection('de')).toBe('ltr');
    expect(textDirection(undefined)).toBe('ltr');
  });
});
