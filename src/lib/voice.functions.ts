import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public showcase transcription: accepts audio only, never reads family records.
export const transcribeQuestion = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({
    audio: z.string().min(16).max(2_000_000).regex(/^[A-Za-z0-9+/]+={0,2}$/),
    mime: z.enum(["audio/wav", "audio/webm", "audio/ogg", "audio/mp4"]),
  }).parse(input))
  .handler(async ({ data }) => {
    const { transcribeAudio, GatewayError } = await import("@lovable.dev/ai-gateway");
    const bytes = Uint8Array.from(atob(data.audio), (char) => char.charCodeAt(0));
    const extension = data.mime.split("/")[1] ?? "wav";
    try {
      const result = await transcribeAudio({
        model: "openai/gpt-transcribe",
        file: new File([bytes], `question.${extension}`, { type: data.mime }),
        language: "en",
      });
      const text = (typeof result === "string" ? result : result.text).trim();
      return text ? { ok: true as const, text } : { ok: false as const, error: "No speech was detected. Please try again." };
    } catch (error) {
      if (error instanceof GatewayError) {
        console.error("Voice transcription failed", { code: error.code, status: error.httpStatus, ids: error.ids });
        return { ok: false as const, error: error.httpStatus === 402 ? "Speech transcription needs available AI credits." : "Speech transcription is unavailable right now. You can type your question instead." };
      }
      console.error("Voice transcription failed without a provider response");
      return { ok: false as const, error: "Could not transcribe your recording. You can type your question instead." };
    }
  });