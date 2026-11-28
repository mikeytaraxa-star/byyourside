import { describe, it, expect } from "vitest";
import { parseCommand,answerQuestion } from "./engine";
describe("family commands", () => {
  it("parses a reminder with detail", () => {
    const r = parseCommand("/remind 14:00 Blue pill — with water");
    expect(r.kind === "remind" && r.reminder).toEqual({ time: "14:00", text: "Blue pill", detail: "with water" });
  });
  it("marks an important reminder for consecutive-day escalation", () => {
    const r = parseCommand("/critical 08:00 Blue pill — with water");
    expect(r.kind === "remind" && r.reminder).toEqual({ time: "08:00", text: "Blue pill", detail: "with water", critical: true });
    expect(r.reply).toContain("second day in a row");
  });
  it("rejects bad times", () => { expect(parseCommand("/remind 25:00 x").kind).toBe("error"); });
  it("parses a person", () => {
    const r = parseCommand("/person Anna | daughter | visits Sundays");
    expect(r.kind === "person" && r.person.relation).toBe("daughter");
  });
  it('never identifies Joanna as Anna from a partial name',()=>{
    expect(answerQuestion('Who is Joanna?',[{name:'Anna',relation:'daughter',note:'Visits Sundays'}],[],840)).not.toContain('your daughter');
    expect(answerQuestion('Who is Anna?',[{name:'Anna',relation:'daughter',note:'Visits Sundays'}],[],840)).toContain('Anna, your daughter');
  });
  it('does not select the first person when a question names two people',()=>{
    expect(answerQuestion('Who are Anna and Peter?',[{name:'Anna',relation:'daughter',note:''},{name:'Peter',relation:'son',note:''}],[],840)).toBe('Please ask about one person by their full name.');
  });
});
