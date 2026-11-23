/** Scripted showcase cues for the four five-second clips, not scene recognition. */
export const FILM_SCENES = [
  { start: 0, title: "GOOD MORNING", body: "Take your blue pill from the table.", footer: "Sample reminder" },
  { start: 5, title: "FOOD ALLERGY", body: "You are allergic to soya beans.", footer: "Sample allergy alert" },
  { start: 10, title: "TODAY · 14:00", body: "Visit Anna — your daughter — at 14:00.", footer: "Sample visit reminder" },
  { start: 15, title: "ANNA'S HOME · NEW YORK CITY", body: "City center · 128 Willow Lane, Apt 4B, New York, NY 10012.", footer: "Fictional demo address" },
] as const;

export function filmSceneAt(seconds: number) {
  const time = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return [...FILM_SCENES].reverse().find(scene => time >= scene.start) ?? FILM_SCENES[0];
}