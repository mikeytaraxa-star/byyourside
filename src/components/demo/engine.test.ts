import { describe, it, expect } from "vitest";
import { parseCommand } from "./engine";
describe("family commands", () => {
  it("parses a reminder with detail", () => {
    const r = parseCommand("/remind 14:00 Blue pill — with water");
    expect(r.kind === "remind" && r.reminder).toEqual({ time: "14:00", text: "Blue pill", detail: "with water" });
  });
  it("rejects bad times", () => { expect(parseCommand("/remind 25:00 x").kind).toBe("error"); });
  it("parses a person", () => {
    const r = parseCommand("/person Anna | daughter | visits Sundays");
    expect(r.kind === "person" && r.person.relation).toBe("daughter");
  });
});
