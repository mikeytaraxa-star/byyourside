// Reply-keyboard buttons use the same command path and permissions as typed input.
const navigationRows = [
  [{ text: "🏡 Family workspace", command: "/family" }, { text: "📝 Add reminder", command: "/remind" }],
  [{ text: "💚 Familiar people", command: "/person" }, { text: "💬 Ask a question", command: "/ask" }],
  [{ text: "👓 Connect glasses", command: "/pair" }, { text: "📍 Find Your Loved One", command: "/findme" }],
  [{ text: "📧 Email alerts", command: "/email" }, { text: "🌙 Daily summary", command: "/summary" }],
  [{ text: "❔ All commands", command: "/help" }],
] as const;

export function navigationCommand(text: string): string {
  const trimmed = text.trim();
  return navigationRows.flat().find(button => button.text === trimmed)?.command ?? trimmed;
}

export function navigationGuidance(command: string): string | null {
  switch (command) {
    case "/remind": return "Add a reminder with a time and description:\n/remind 14:00 Blue pill — with water\n\nFor an important reminder:\n/critical 08:00 Blue pill — with water\n\nOr open /family to edit the schedule.";
    case "/person": return "Add someone familiar with their name, relationship and a note:\n/person Anna | daughter | visits Sundays\n\nOr open /family to manage familiar people.";
    case "/ask": return "Send your question after /ask:\n/ask What is next?\n\nAnswers use your family's saved information. If live Cocoon is unavailable, the answer is explicitly labeled as a demo.";
    default: return null;
  }
}

export function welcomeKeyboard(chatId: number, command: string) {
  if (chatId <= 0 || (command !== "/start" && command !== "/help")) return undefined;
  return {
    keyboard: navigationRows.map(row => row.map(button => ({ text: button.text }))),
    resize_keyboard: true,
    is_persistent: true,
  };
}