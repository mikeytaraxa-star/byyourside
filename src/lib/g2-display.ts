import type { G2Display } from "@/hooks/use-even-hub";

/** Conservative native text bounds; never send unbounded family input to G2. */
export function fitG2Text(value: string, columns: number, rows: number) {
  const words = value.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    for (let offset = 0; offset < word.length; offset += columns) {
      const part = word.slice(offset, offset + columns);
      if (line && line.length + part.length + 1 > columns) {
        lines.push(line);
        line = "";
      }
      line += `${line ? " " : ""}${part}`;
    }
  }
  if (line) lines.push(line);
  if (lines.length > rows) {
    const last = lines[rows - 1] ?? "";
    lines[rows - 1] = `${last.slice(0, columns - 1)}…`;
  }
  return lines.slice(0, rows).join("\n");
}

export function nativeDisplay(display: G2Display) {
  return {
    clock: fitG2Text(display.clock, 8, 1),
    body: `${fitG2Text(display.title, 22, 1)}\n${fitG2Text(display.body, 22, 4)}`,
    footer: fitG2Text(display.footer ?? "", 22, 1),
  };
}

export const G2_REGIONS = {
  clock: { containerID: 1, containerName: "bys-clock", xPosition: 24, yPosition: 24, width: 128, height: 40, isEventCapture: 0 },
  body: { containerID: 2, containerName: "bys-reminder", xPosition: 292, yPosition: 24, width: 260, height: 156, isEventCapture: 1 },
  footer: { containerID: 3, containerName: "bys-footer", xPosition: 292, yPosition: 204, width: 260, height: 36, isEventCapture: 0 },
} as const;