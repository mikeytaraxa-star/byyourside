import { afterEach, describe, expect, it, vi } from "vitest";
import { askCocoon, cocoonMessages, demoCocoonAnswer } from "./cocoon.server";
afterEach(()=>vi.restoreAllMocks());

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
  it('never logs or throws private provider response bodies',async()=>{
    vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('private medication facts and credential',{status:500}));
    const log=vi.spyOn(console,'error').mockImplementation(()=>{});
    await expect(askCocoon({baseUrl:'https://cocoon.example',apiKey:'test-only',question:'Next?',context:'private'})).rejects.toThrow('Cocoon request failed [500]');
    expect(JSON.stringify(log.mock.calls)).not.toContain('private medication');
    expect(JSON.stringify(log.mock.calls)).not.toContain('credential');
  });
  it('does not send family information to an insecure endpoint',async()=>{
    const fetch=vi.spyOn(globalThis,'fetch');
    await expect(askCocoon({baseUrl:'http://cocoon.example',apiKey:'test-only',question:'Next?',context:'private'})).rejects.toThrow('HTTPS');
    expect(fetch).not.toHaveBeenCalled();
  });
});
