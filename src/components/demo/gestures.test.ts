import { describe, expect, it } from "vitest";
import { browseIndex, decodeGesture, G2_MENU } from "./gestures";
import { answerQuestion } from "./engine";

describe("G2 and R1 input", () => {
  it.each([[0, "tap"], [1, "swipe-up"], [2, "swipe-down"], [3, "double-tap"], [9, "hold"], [10, "release"]] as const)("routes real PB event %i to %s", (type, gesture) => {
    expect(decodeGesture({ sysEvent: { eventType: type, eventSource: 2 } })).toEqual({ gesture, source: "R1 ring" });
  });
  it("does not confuse missing event type with a confirmation", () => { expect(decodeGesture({ textEvent: { containerID: 2 } })).toBeNull(); });
  it("does not route IMU samples as taps", () => { expect(decodeGesture({ sysEvent: { eventType: 8 } })).toBeNull(); });
  it("registers four distinct valid menu actions", () => {
    expect(G2_MENU.map((m) => m.itemID)).toEqual([1, 2, 3, 4]);
    expect(decodeGesture({ menuItemClickEvent: { itemID: 3 } })).toEqual({ gesture: "menu-ask", source: "G2 menu" });
  });
  it("cycles reminders in both directions", () => {
    expect(browseIndex(-1, 1, 2)).toBe(0); expect(browseIndex(0, -1, 2)).toBe(1); expect(browseIndex(1, 1, 2)).toBe(0); expect(browseIndex(0, 1, 0)).toBe(-1);
  });
});
describe("spoken questions", () => {
  it("answers the actual next reminder using family data", () => {
    expect(answerQuestion("What's next?", [], [{ id: "1", time: "15:00", text: "Doctor", status: "pending" }], 840)).toBe("Next: Doctor at 15:00.");
  });
  it("answers a named person rather than guessing who is visible", () => {
    expect(answerQuestion("Who is Peter?", [{ name: "Peter", relation: "son", note: "Visits today." }], [], 840)).toBe("Peter, your son. Visits today.");
  });
});