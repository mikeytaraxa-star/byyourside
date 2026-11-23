import { Blob as NodeBlob } from "node:buffer";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { MAX_PCM_BYTES, MAX_RECORDING_MS, pcmToWav } from "./voice-audio";

describe("G2 microphone audio", () => {
  beforeAll(() => vi.stubGlobal("Blob", NodeBlob));
  afterAll(() => vi.unstubAllGlobals());
  it("wraps raw PCM as 16 kHz mono 16-bit WAV", async () => {
    const bytes = await pcmToWav([new Uint8Array([1, 2, 3, 4])]).arrayBuffer();
    const view = new DataView(bytes);
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("RIFF");
    expect(view.getUint16(22, true)).toBe(1); expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getUint16(34, true)).toBe(16); expect(view.getUint32(40, true)).toBe(4);
    expect([...new Uint8Array(bytes.slice(44))]).toEqual([1, 2, 3, 4]);
  });
  it("caps a recording at twenty seconds", () => { expect(MAX_RECORDING_MS).toBe(20000); expect(MAX_PCM_BYTES).toBe(640000); expect(() => pcmToWav([new Uint8Array(640002)])).toThrow(); });
  it("rejects empty and partial samples", () => { expect(() => pcmToWav([])).toThrow(); expect(() => pcmToWav([new Uint8Array(1)])).toThrow(); });
});