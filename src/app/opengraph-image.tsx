import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The link-preview card, generated at build time from the site's own tokens
 * rather than maintained as a separate exported image. A hand-made PNG drifts
 * from the design the first time a colour changes; this cannot.
 *
 * Rendered by Satori, which supports a subset of CSS. Notably it has no default
 * font, so one must be supplied explicitly, and it does not read globals.css, so
 * the palette below is duplicated deliberately. Keep it in step with
 * `--bg`, `--text-secondary` and the `.name-gradient` sweep.
 *
 * The font is a STATIC instance of Fraunces. Satori cannot render the variable
 * font the site loads (it fails with "Cannot read properties of undefined"), so
 * the display weight is instanced once, offline, and committed. Derivation and
 * hashes are in src/assets/Fraunces-PROVENANCE.md.
 */
export const alt = "Jacob J. Choi, Musician x AI Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Same four stops as .name-gradient in globals.css. */
const SWEEP = "linear-gradient(100deg, #FF9E8A 0%, #54E09C 34%, #2FD2CE 64%, #36ADEE 100%)";
const BG = "#0a0a0c";
const TEXT_SECONDARY = "#9A958C";

export default async function Image() {
  const fraunces = readFileSync(join(process.cwd(), "src/assets/Fraunces-Display600.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: BG,
          padding: "0 92px",
          position: "relative",
        }}
      >
        {/* The faint iridescent vignette the site carries, flattened to one wash. */}
        <div
          style={{
            position: "absolute",
            top: -240,
            left: -160,
            width: 900,
            height: 900,
            background: "radial-gradient(circle, rgba(84,224,156,0.10) 0%, rgba(10,10,12,0) 68%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -300,
            right: -180,
            width: 900,
            height: 900,
            background: "radial-gradient(circle, rgba(54,173,238,0.10) 0%, rgba(10,10,12,0) 68%)",
          }}
        />

        <div
          style={{
            display: "flex",
            fontFamily: "Fraunces",
            fontSize: 128,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            backgroundImage: SWEEP,
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Jacob J. Choi
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginTop: 34,
            fontFamily: "Fraunces",
            fontSize: 44,
          }}
        >
          <span style={{ color: "#45DD9E" }}>Musician</span>
          <span style={{ color: TEXT_SECONDARY, fontSize: 30 }}>x</span>
          <span style={{ color: "#36C5E6" }}>AI Engineer</span>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontFamily: "Fraunces",
            fontStyle: "italic",
            fontSize: 28,
            color: TEXT_SECONDARY,
          }}
        >
          &quot;Melos contra mundum&quot;
        </div>

        {/* The waveform motif, flattened. Satori has no SVG path animation, and a
            still stroke is what the site shows after its draw-on anyway. */}
        <svg width="1016" height="56" viewBox="0 0 1000 70" style={{ marginTop: 40 }}>
          <defs>
            <linearGradient id="voice" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FF9E8A" />
              <stop offset="34%" stopColor="#54E09C" />
              <stop offset="64%" stopColor="#2FD2CE" />
              <stop offset="100%" stopColor="#36ADEE" />
            </linearGradient>
          </defs>
          <path
            d="M 0 35 Q 8 33 16 32 Q 47 27 78 24 Q 109 22 141 24 Q 172 28 203 34 Q 234 41 266 46 Q 297 49 328 47 Q 359 43 391 38 Q 422 33 453 30 Q 484 29 516 32 Q 547 36 578 40 Q 609 42 641 40 Q 672 35 703 28 Q 734 21 766 17 Q 797 16 828 19 Q 859 24 891 29 Q 922 32 953 33 Q 984 34 1000 35"
            fill="none"
            stroke="url(#voice)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>

        {/* The domain, bottom right. A preview card is often seen without the URL
            beside it, so the card should say where it goes. It also balances the
            composition, which is otherwise weighted hard to the left. */}
        <div
          style={{
            position: "absolute",
            right: 92,
            bottom: 64,
            display: "flex",
            fontFamily: "Fraunces",
            fontSize: 24,
            letterSpacing: "0.06em",
            color: "#7D7870",
          }}
        >
          jacobjchoi.xyz
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Fraunces", data: fraunces, style: "normal" }],
    }
  );
}
