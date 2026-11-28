import { describe, expect, it } from 'vitest';
import { ageLabel, isFindMeCommand, isFresh, validLocation, venueBody } from './findme';

const now = new Date('2026-11-24T10:00:00Z');
describe('findme', () => {
  it('recognises /findme only', () => {
    expect(isFindMeCommand('/findme')).toBe(true);
    expect(isFindMeCommand('/findme@bysappbot')).toBe(true);
    expect(isFindMeCommand('/findmenow')).toBe(false);
  });
  it('rejects impossible coordinates', () => {
    expect(validLocation({ latitude: 95, longitude: 10 })).toBeNull();
    expect(validLocation({ latitude: 52.52, longitude: 13.4, accuracy: 12 })).toEqual({ lat: 52.52, lng: 13.4, accuracy: 12 });
  });
  it('never treats missing or string coordinates as a real shared position',()=>{
    expect(validLocation({latitude:null,longitude:null})).toBeNull();
    expect(validLocation({latitude:'',longitude:''})).toBeNull();
    expect(validLocation({latitude:'52.52',longitude:13.4})).toBeNull();
    expect(validLocation({latitude:0,longitude:0,accuracy:null})).toEqual({lat:0,lng:0,accuracy:null});
  });
  it('rejects future and invalid location timestamps',()=>{
    expect(isFresh('2099-01-01',now)).toBe(false);
    expect(isFresh('not-a-date',now)).toBe(false);
  });
  it('treats a location older than 10 minutes as stale', () => {
    expect(isFresh('2026-11-24T09:51:00Z', now)).toBe(true);
    expect(isFresh('2026-11-24T09:49:00Z', now)).toBe(false);
  });
  it('builds a venue card with age and accuracy', () => {
    const body = venueBody(7, { lat: 1, lng: 2, accuracy: 14.6, at: '2026-11-24T09:57:00Z' }, now);
    expect(body.address).toBe('Glasses location · 3 min ago · ±15 m');
    expect(ageLabel('2026-11-24T07:00:00Z', now)).toBe('3 h ago');
  });
});
