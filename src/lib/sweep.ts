/**
 * The iridescent sweep: coral, green, teal, blue. Shared by the places that
 * render it from TypeScript: the waveform and signature strokes, the hero
 * photo frame and the link-preview card.
 *
 * One copy remains outside it: `.name-gradient` in globals.css, which CSS cannot
 * import. Keep that rule in step with these values.
 */
export const SWEEP = {
  coral: "#FF9E8A",
  green: "#54E09C",
  teal: "#2FD2CE",
  blue: "#36ADEE",
} as const;

/** The four stops at their positions, for SVG <linearGradient> and CSS alike. */
export const SWEEP_STOPS = [
  { offset: "0%", color: SWEEP.coral },
  { offset: "34%", color: SWEEP.green },
  { offset: "64%", color: SWEEP.teal },
  { offset: "100%", color: SWEEP.blue },
] as const;

/** The sweep as a CSS linear-gradient at the given angle. */
export const sweepGradient = (degrees: number) =>
  `linear-gradient(${degrees}deg, ${SWEEP_STOPS.map((s) => `${s.color} ${s.offset}`).join(", ")})`;
