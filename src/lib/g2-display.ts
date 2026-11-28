import type { G2Display } from "@/hooks/use-even-hub";

/** Conservative native text bounds; never send unbounded family input to G2. */
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const glyphs = (value: string) => Array.from(segmenter.segment(value), entry => entry.segment);
export function g2TextWidth(value: string) {
  return glyphs(value).reduce((width, glyph) => width + glyphWidth(glyph), 0);
}
function glyphWidth(glyph: string) {
  return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Extended_Pictographic}]/u.test(glyph) ? 2 : 1;
}
export function fitG2Text(value: string, columns: number, rows: number) {
  if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 2 || rows < 1) return '';
  const words = value.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const parts: string[] = [];
    let part = '';
    for (const glyph of glyphs(word)) {
      if (part && g2TextWidth(part + glyph) > columns) { parts.push(part); part = ''; }
      part += glyph;
    }
    if (part) parts.push(part);
    for (const part of parts) {
      if (line && g2TextWidth(line) + g2TextWidth(part) + 1 > columns) {
        lines.push(line);
        line = "";
      }
      line += `${line ? " " : ""}${part}`;
    }
  }
  if (line) lines.push(line);
  if (lines.length > rows) {
    const last = lines[rows - 1] ?? "";
    let clipped = '';
    for (const glyph of glyphs(last)) {
      if (g2TextWidth(clipped + glyph) > columns - 1) break;
      clipped += glyph;
    }
    lines[rows - 1] = `${clipped}…`;
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