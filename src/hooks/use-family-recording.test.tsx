import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFamilyRecording } from './use-family-recording';
let active: FakeRecorder | undefined;
class FakeRecorder {
  static isTypeSupported() { return true; }
  state = 'inactive'; mimeType = 'audio/webm';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor() { active = this; }
  start() { this.state = 'recording'; }
  stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['local voice'], { type: this.mimeType }) }); this.onstop?.(); }
}
function setup() {
  const stop = vi.fn();
  const getUserMedia = vi.fn(async () => ({ getTracks: () => [{ stop }] }));
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
  vi.stubGlobal('MediaRecorder', FakeRecorder);
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:local-preview'), revokeObjectURL: vi.fn() });
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  return { stop, getUserMedia, fetch };
}
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); active = undefined; });
describe('family voice recording', () => {
  it('requires consent before opening the phone microphone', async () => {
    const f = setup(); const { result, unmount } = renderHook(useFamilyRecording);
    await act(async () => { await result.current.start(); });
    expect(f.getUserMedia).not.toHaveBeenCalled(); unmount();
  });
  it('stops at 60 seconds, previews locally and never uploads without saving', async () => {
    vi.useFakeTimers(); const f = setup(); const { result, unmount } = renderHook(useFamilyRecording);
    act(() => result.current.setConsent(true));
    await act(async () => { await result.current.start(); });
    expect(active?.state).toBe('recording');
    act(() => vi.advanceTimersByTime(60_000));
    expect(active?.state).toBe('inactive');
    expect(result.current.status).toBe('preview');
    expect(result.current.blob?.type).toBe('audio/webm');
    expect(f.stop).toHaveBeenCalled(); expect(f.fetch).not.toHaveBeenCalled();
    act(() => result.current.discard());
    expect(result.current.blob).toBeNull(); expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:local-preview'); unmount();
  });
  it('releases the microphone and discards pending data on unmount', async () => {
    const f = setup(); const { result, unmount } = renderHook(useFamilyRecording);
    act(() => result.current.setConsent(true)); await act(async () => { await result.current.start(); });
    unmount(); expect(f.stop).toHaveBeenCalled(); expect(URL.createObjectURL).not.toHaveBeenCalled(); expect(f.fetch).not.toHaveBeenCalled();
  });
});