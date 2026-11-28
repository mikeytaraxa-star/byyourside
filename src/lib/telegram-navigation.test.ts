import { describe, expect, it } from "vitest";
import { navigationCommand, navigationGuidance, welcomeKeyboard } from "./telegram-navigation";

describe("Telegram welcome navigation", () => {
  it("attaches usable buttons to private start and help replies", () => {
    for (const command of ["/start", "/help"]) {
      const keyboard = welcomeKeyboard(7, command);
      expect(keyboard?.keyboard.flat().map(button => navigationCommand(button.text))).toEqual([
        "/family", "/remind", "/person", "/ask", "/pair", "/findme", "/email", "/summary", "/help",
      ]);
      expect(keyboard?.resize_keyboard).toBe(true);
      expect(keyboard?.is_persistent).toBe(true);
    }
  });
  it("keeps typed commands and their arguments unchanged", () => {
    expect(navigationCommand(" /remind 14:00 Blue pill — with water ")).toBe("/remind 14:00 Blue pill — with water");
    expect(navigationCommand("/email verify ABCDE-FGHJK-LMNPQ")).toBe("/email verify ABCDE-FGHJK-LMNPQ");
  });
  it("routes buttons requiring details to guidance rather than creating sample care facts", () => {
    expect(navigationGuidance(navigationCommand("📝 Add reminder"))).not.toBeNull();
    expect(navigationGuidance(navigationCommand("💚 Familiar people"))).not.toBeNull();
    expect(navigationGuidance(navigationCommand("💬 Ask a question"))).not.toBeNull();
    expect(navigationGuidance("/remind 14:00 Blue pill")).toBeNull();
  });
  it("does not install a shared keyboard in groups or unrelated replies", () => {
    expect(welcomeKeyboard(-100, "/start")).toBeUndefined();
    expect(welcomeKeyboard(7, "/pair")).toBeUndefined();
  });
});