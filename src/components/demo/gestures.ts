export type Gesture = "tap" | "double-tap" | "swipe-up" | "swipe-down" | "hold" | "release" | "menu-done" | "menu-next" | "menu-ask" | "menu-today" | "menu-later" | "menu-help" | "menu-decline" | "menu-repeat" | "menu-routine";
export type GestureSource = "Right temple" | "Left temple" | "R1 ring" | "G2 input" | "G2 menu";
export const G2_MENU = [
  { itemID: 1, itemName: "Done" },
  { itemID: 2, itemName: "Next reminder" },
  { itemID: 3, itemName: "Ask a question" },
  { itemID: 4, itemName: "Today" },
  { itemID: 5, itemName: "A little later" },
  { itemID: 6, itemName: "I need help" },
  { itemID: 7, itemName: "Not today" },
  { itemID: 8, itemName: "Show again" },
  { itemID: 9, itemName: "Routines" },
];

// PB enum values from Even Hub SDK 0.0.16; this module is browser/SSR safe.
export function decodeGesture(event: {
  sysEvent?: { eventType?: number; eventSource?: number };
  textEvent?: { eventType?: number; containerID?: number };
  listEvent?: { eventType?: number };
  menuItemClickEvent?: { itemID?: number };
}): { gesture: Gesture; source: GestureSource } | null {
  const menu = event.menuItemClickEvent?.itemID;
  const menuActions: Record<number, Gesture> = { 1: "menu-done", 2: "menu-next", 3: "menu-ask", 4: "menu-today", 5: "menu-later", 6: "menu-help", 7: "menu-decline", 8: "menu-repeat", 9: "menu-routine" };
  if (menu !== undefined) {
    const gesture = menuActions[menu];
    return gesture ? { gesture, source: "G2 menu" } : null;
  }
  const type = event.sysEvent?.eventType ?? event.textEvent?.eventType ?? event.listEvent?.eventType;
  const actions: Record<number, Gesture> = { 0: "tap", 1: "swipe-up", 2: "swipe-down", 3: "double-tap", 9: "hold", 10: "release" };
  if (type === undefined) return null;
  const gesture = actions[type];
  if (!gesture) return null;
  const source = event.sysEvent?.eventSource;
  return { gesture, source: source === 2 ? "R1 ring" : source === 1 ? "Right temple" : source === 3 ? "Left temple" : "G2 input" };
}

export function browseIndex(current: number, direction: -1 | 1, length: number) {
  if (length <= 0) return -1;
  return current < 0 ? (direction === 1 ? 0 : length - 1) : (current + direction + length) % length;
}