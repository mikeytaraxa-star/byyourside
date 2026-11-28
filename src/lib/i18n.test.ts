import { describe, expect, it } from 'vitest';
import { DICTIONARIES, fill, isLanguage, LANGUAGES, LANGUAGE_NAMES, stringsFor, textDirection, type Strings } from './i18n';
import { controlsFor } from './i18n-controls';
import { g2TextWidth } from './g2-display';

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
  it.each(LANGUAGES)('preserves interpolation parameters for every %s message', code => {
    const placeholders=(text:string)=>[...text.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
    for(const key of keys) expect(placeholders(DICTIONARIES[code][key])).toEqual(placeholders(DICTIONARIES.en[key]));
    const controls=controlsFor(code);
    for(const key of Object.keys(controls) as (keyof typeof controls)[]){
      expect(controls[key].trim().length).toBeGreaterThan(0);
      expect(placeholders(controls[key])).toEqual(placeholders(controlsFor('en')[key]));
      expect(fill(controls[key],{answer:'Family text',name:'Anna',kind:'photo',step:2,total:3})).not.toMatch(/\{\w+\}/);
    }
  });
  it.each(LANGUAGES)('keeps %s native commands intact inside the fixed action region', code => {
    const t=DICTIONARIES[code];
    for(const command of [t.g2TapDone,t.g2TapNext,t.g2DoubleTapToday,t.g2Release,t.g2NotDue,t.g2HelpRequested,t.g2ALittleLater,t.stateDone,t.stateDeclined]) {
      expect(g2TextWidth(command)).toBeLessThanOrEqual(22);
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
