import { describe, expect, it } from "vitest";
import { askCocoon, cocoonMessages, demoCocoonAnswer } from "./cocoon.server";

describe("Cocoon integration", () => {
  it("keeps answers grounded in the supplied family context", () => {
    const messages = cocoonMessages("Who is Anna?", "Anna is their daughter. She visits Sundays.");
    expect(messages[1]?.content).toContain("Anna is their daughter");
    expect(messages[1]?.content).toContain("Who is Anna?");
    expect(messages[0]?.content).toContain("Never diagnose");
  });

  it("labels the no-credential response as a demo without making a network request", async () => {
    const result = await askCocoon({ question: "What is next?", context: "14:00 Blue pill" });
    expect(result.mode).toBe("demo");
    expect(result.text).toContain("Demo answer:");
  });

  it("uses the next real reminder in the demo example", () => {
    expect(demoCocoonAnswer({ title: "Blue pill", local_time: "14:00" })).toContain(
      "Blue pill at 14:00",
    );
  });
});
