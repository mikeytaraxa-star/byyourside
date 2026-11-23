import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EvenHubEvent } from "@evenrealities/even_hub_sdk";
import { useEvenHub } from "./use-even-hub";

const display = { clock: "14:00", title: "TODAY", body: "Blue pill" };
const native = vi.hoisted(() => ({
  emit: null as ((event: EvenHubEvent) => void) | null,
  bridge: {
    createStartUpPageContainer: vi.fn(async () => 0),
    textContainerUpgrade: vi.fn(async () => true),
    onEvenHubEvent: vi.fn(),
    onAppLocationChanged: vi.fn(() => () => {}),
    imuControl: vi.fn(async () => true),
    startAppLocationUpdates: vi.fn(async () => true),
    stopAppLocationUpdates: vi.fn(async () => true),
    getAppLocation: vi.fn(async () => null),
    shutDownPageContainer: vi.fn(async () => true),
    audioControl: vi.fn(async () => true),
  },
}));
vi.mock("@evenrealities/even_hub_sdk", async (original) => {
  const sdk = await original<typeof import("@evenrealities/even_hub_sdk")>();
  return { ...sdk, waitForEvenAppBridge: async () => native.bridge };
});
beforeEach(() => {
  vi.clearAllMocks();
  native.emit = null;
  native.bridge.onEvenHubEvent.mockImplementation((callback: (event: EvenHubEvent) => void) => {
    native.emit = callback;
    return () => { native.emit = null; };
  });
});

describe("G2 no-hardware showcase", () => {
  it("provides clearly simulated location and motion samples", () => {
    const { result, unmount } = renderHook(() => useEvenHub({ display, onGesture: () => {} }));
    act(() => result.current.simulate());
    expect(result.current.status).toBe("simulated");
    expect(result.current.location).toMatchObject({ latitude: 52.52, longitude: 13.405 });
    expect(result.current.motion).not.toBeNull();
    expect(result.current.message).toContain("simulation");
    act(() => result.current.stop());
    expect(result.current.location).toBeNull();
    unmount();
  });
});

describe("native G2 bridge wiring (mocked hardware)", () => {
  it("routes R1 gestures and contextual menu actions without treating IMU as taps", async () => {
    const sdk = await import("@evenrealities/even_hub_sdk");
    const onGesture = vi.fn();
    const { result, unmount } = renderHook(() => useEvenHub({ display, onGesture }));
    await act(async () => { expect(await result.current.connect()).toBe(true); });
    for (const type of [0, 1, 2, 3, 9, 10] as const) {
      act(() => native.emit?.({ sysEvent: new sdk.Sys_ItemEvent({ eventType: type, eventSource: 2 }) }));
    }
    expect(onGesture.mock.calls).toEqual([
      ["tap", "R1 ring"], ["swipe-up", "R1 ring"], ["swipe-down", "R1 ring"],
      ["double-tap", "R1 ring"], ["hold", "R1 ring"], ["release", "R1 ring"],
    ]);
    act(() => native.emit?.({ menuItemClickEvent: new sdk.MenuItemClickEvent({ itemID: 3 }) }));
    expect(onGesture).toHaveBeenLastCalledWith("menu-ask", "G2 menu");
    act(() => native.emit?.({ sysEvent: new sdk.Sys_ItemEvent({ eventType: 8, imuData: new sdk.IMU_Report_Data({ x: 1, y: 2, z: 3 }) }) }));
    expect(onGesture).toHaveBeenCalledTimes(7);
    expect(result.current.motion).toEqual({ x: 1, y: 2, z: 3 });
    expect(native.bridge.createStartUpPageContainer.mock.calls[0]?.length).toBe(1);
    unmount();
  });
  it("opens the glasses MIC, forwards its PCM only, and closes on cleanup", async () => {
    const sdk = await import("@evenrealities/even_hub_sdk");
    const { result, unmount } = renderHook(() => useEvenHub({ display, onGesture: vi.fn() }));
    await act(async () => { await result.current.connect(); });
    const chunk = vi.fn();
    await act(async () => { await result.current.startAudio(chunk); });
    expect(native.bridge.audioControl).toHaveBeenCalledWith(true, sdk.AudioInputSource.Glasses);
    const bytes = new Uint8Array([1, 2]);
    act(() => native.emit?.({ audioEvent: new sdk.AudioEvent({ audioPcm: bytes, source: sdk.AudioInputSource.Glasses }) }));
    expect(chunk).toHaveBeenCalledWith(bytes);
    act(() => native.emit?.({ audioEvent: new sdk.AudioEvent({ audioPcm: bytes, source: sdk.AudioInputSource.Phone }) }));
    expect(chunk).toHaveBeenCalledTimes(1);
    await act(async () => { await result.current.stopAudio(); });
    expect(native.bridge.audioControl).toHaveBeenLastCalledWith(false);
    unmount();
    expect(native.bridge.shutDownPageContainer).toHaveBeenCalled();
  });
});
