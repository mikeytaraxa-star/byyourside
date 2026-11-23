export const MAX_RECORDING_MS = 20_000;
export const MAX_PCM_BYTES = 16_000 * 2 * (MAX_RECORDING_MS / 1000);

/** G2 MIC frames are 16 kHz, mono, signed 16-bit little-endian PCM. */
export function pcmToWav(chunks: Uint8Array[]): Blob {
  const length = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  if (!length || length > MAX_PCM_BYTES || length % 2 !== 0) throw new Error("Invalid microphone audio.");
  const bytes = new Uint8Array(44 + length);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  text(0, "RIFF"); view.setUint32(4, 36 + length, true); text(8, "WAVE");
  text(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, 16000, true); view.setUint32(28, 32000, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, "data"); view.setUint32(40, length, true);
  let offset = 44;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new Blob([bytes], { type: "audio/wav" });
}
