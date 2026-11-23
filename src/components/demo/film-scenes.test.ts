import { describe, expect, it } from "vitest";
import { filmSceneAt } from "./film-scenes";

describe("fullscreen scene boundaries", () => {
  it("keeps the morning cue until the fridge clip starts at 5 seconds", () => {
    expect(filmSceneAt(0).start).toBe(0);
    expect(filmSceneAt(4.999).start).toBe(0);
    expect(filmSceneAt(5).start).toBe(5);
  });
  it("switches to the door cue at 10 seconds", () => {
    expect(filmSceneAt(9.999).start).toBe(5);
    expect(filmSceneAt(10).start).toBe(10);
  });
  it("switches to the driving cue at 15 seconds", () => {
    expect(filmSceneAt(14.999).start).toBe(10);
    expect(filmSceneAt(15).start).toBe(15);
    expect(filmSceneAt(20.064).start).toBe(15);
  });
  it("selects the correct cue after seeking backward or replaying", () => {
    expect(filmSceneAt(18).start).toBe(15);
    expect(filmSceneAt(7).start).toBe(5);
    expect(filmSceneAt(0).start).toBe(0);
  });
});