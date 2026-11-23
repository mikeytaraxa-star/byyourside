import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useVoiceQuestion } from "./use-voice-question";
import type { EvenHubController } from "./use-even-hub";

function controller(): EvenHubController {
  return {
    status: "connected", message: "", location: null, motion: null,
    connect: vi.fn(async () => true), simulate: vi.fn(), stop: vi.fn(),
    startAudio: vi.fn(async (callback) => { callback(new Uint8Array(200)); }),
    stopAudio: vi.fn(async () => {}),
  };
}
afterEach(() => vi.unstubAllGlobals());

describe("Cocoon-only voice showcase", () => {
  it("uses selected demo data without uploading audio or calling another AI", async () => {
    const fetch = vi.fn(() => { throw new Error("No external requests permitted"); });
    vi.stubGlobal("fetch", fetch);
    const g2 = controller();
    const onQuestion = vi.fn();
    const { result, unmount } = renderHook(() => useVoiceQuestion(g2, onQuestion));
    act(() => { result.current.setConsent(true); result.current.setDemoQuestion("Who is Anna?"); });
    await act(async () => { await result.current.start(); });
    expect(result.current.status).toBe("listening");
    await act(async () => { await result.current.stop(); });
    expect(onQuestion).toHaveBeenCalledExactlyOnceWith("Who is Anna?");
    expect(result.current.transcript).toBe("Who is Anna?");
    expect(result.current.status).toBe("idle");
    expect(g2.stopAudio).toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    unmount();
  });
  it("never opens a microphone without consent", async () => {
    const g2 = controller();
    const { result, unmount } = renderHook(() => useVoiceQuestion(g2, vi.fn()));
    await act(async () => { await result.current.start(); });
    expect(g2.startAudio).not.toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
    unmount();
  });
  it("does not let a cancelled recording overwrite a newer template", async () => {
    const g2 = controller();
    let finishStop: (() => void) | undefined;
    const pendingStop = new Promise<void>((resolve) => { finishStop = resolve; });
    g2.stopAudio = vi.fn(() => pendingStop);
    const onQuestion = vi.fn();
    const { result, unmount } = renderHook(() => useVoiceQuestion(g2, onQuestion));
    act(() => result.current.setConsent(true));
    await act(async () => { await result.current.start(); });
    let stopping: Promise<void> | undefined;
    act(() => { stopping = result.current.stop(); });
    act(() => { result.current.cancel(); result.current.setDemoQuestion("Who is Peter?"); });
    await act(async () => { finishStop?.(); await stopping; });
    expect(onQuestion).not.toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
    unmount();
  });
});