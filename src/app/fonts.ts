import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";

/**
 * The three voices of the design, self-hosted.
 *
 * These were previously an `@import` at the top of globals.css, which is the
 * slowest way to load a font: the browser has to fetch globals.css, parse it,
 * discover the @import, fetch Google's stylesheet, parse THAT, and only then
 * request the font files. Four serialised round trips to a third party before a
 * glyph renders, all of it blocking. next/font downloads the files at build time
 * and serves them from this origin, so the chain collapses and no visitor ever
 * contacts Google.
 *
 * Each exposes a CSS custom property rather than a family name, because the
 * generated family is hashed and not writable by hand. globals.css consumes
 * `var(--font-*)` with the same fallback stacks as before.
 *
 * Tradeoff worth naming: this moves a dependency on Google from REQUEST time to
 * BUILD time. That is the better place for it. A build-time fetch failure is
 * loud, gated by CI, and blocks the merge; a request-time failure is silent and
 * lands on a visitor as a fallback font.
 */

/* Variable. `opsz` is carried deliberately: nothing sets font-optical-sizing, so
   the browser default of `auto` varies the design by font size, which is doing
   real work between the 8xl hero name and the small italic motto. Dropping the
   axis would flatten that with no error. Italic is required by the motto and the
   mentor line. */
export const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-fraunces",
});

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});
