import { Fraunces, Geist, Geist_Mono } from "next/font/google";

/**
 * The type of the design, self-hosted.
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
   real work between the 2xl title line and the small italic motto. Dropping the
   axis would flatten that with no error. Italic is required by the motto and the
   section numerals. */
export const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-fraunces",
});

/* The sans for everything that is not a serif accent or a label: body text at
   400, the name and the contact email at 500. Only those two weights are
   loaded. The link-preview card renders the name from a committed static file
   of the 500 weight, see src/assets/Geist-Medium.ttf.

   Variable names are not `--font-sans` / `--font-mono`: Tailwind 4 defines
   theme variables with those names, so the two would compete and the result
   would depend on cascade order. */
export const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-geist",
});

/* Labels, dates, companies, tech tags, the footer. Designed alongside Geist,
   so the two read as one family. Only weight 400 is used. */
export const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-geist-mono",
});
