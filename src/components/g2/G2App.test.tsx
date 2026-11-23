import { act, cleanup, render, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { G2App } from './G2App';
import type { Gesture, GestureSource } from '@/components/demo/gestures';
const native = vi.hoisted(() => ({
  input: null as ((gesture: Gesture, source: GestureSource) => void) | null,
  chunk: null as ((chunk: Uint8Array) => void) | null,
  readStorage: vi.fn(async () => ''), writeStorage: vi.fn(async () => true),
  startAudio: vi.fn(async (callback: (chunk: Uint8Array) => void) => { native.chunk = callback; }),
  stopAudio: vi.fn(async () => {}), connect: vi.fn(async () => true), stop: vi.fn(),
  setSensors: vi.fn(async () => {}), simulate: vi.fn(),
}));
vi.mock('@/hooks/use-even-hub', () => ({ useEvenHub: ({ onGesture }: { onGesture: (gesture: Gesture, source: GestureSource) => void }) => {
  native.input = onGesture;
  return { status: 'connected', message: '', location: null, motion: null, sensorsActive: false, ...native };
} }));
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe('hardware companion privacy', () => {
  it('never opens G2 audio for a long press without consent', async () => {
    render(<G2App />);
    await act(async () => { native.input?.('hold', 'R1 ring'); });
    expect(native.startAudio).not.toHaveBeenCalled();
  });
  it('stops local audio after 12 seconds without any uploads', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    vi.useFakeTimers();
    render(<G2App />);
    await act(async () => {});
    fireEvent.click(screen.getByRole('checkbox', { name: 'Allow local G2 microphone' }));
    await act(async () => { native.input?.('hold', 'Right temple'); });
    expect(native.startAudio).toHaveBeenCalledTimes(1);
    act(() => { native.chunk?.(new Uint8Array(16000)); });
    const stops = native.stopAudio.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(12000); });
    expect(native.stopAudio.mock.calls.length).toBeGreaterThan(stops);
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
  });
});
