"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { signatureStrokes, signatureBox } from "@/constants/signature";
import { SWEEP_STOPS } from "@/lib/sweep";

/* Two steps, the same as the header on the GitHub profile:
   1. The outline is written left to right at a constant pen speed, one piece
      after another in writing order.
   2. Once the pen has finished, the colour fill sweeps in left to right.
   Both are CSS transitions started by one state change, with no per-frame JS.

   Each piece is its own <path> with pathLength=1, so its dash is measured
   against that piece alone, and waiting pieces sit at dash 1 on, 2 off,
   parked at offset 1.05. Both are workarounds for WebKit found on the profile
   header in Safari: with one multi-subpath path, the dash pattern restarted
   at every subpath and all the pieces drew at once; with dasharray 1 and
   offset 1, a zero-length dash sat on each path's end and WebKit painted its
   round cap there, a dot before the pen arrived. Not re-tested in Safari on
   this site. */
/* Half the profile header's 3.2s + 1.5s: the owner picked this pace after
   comparing both on the site (2026-10-18). Fewer paints too: about 290 per
   reveal against about 570 at the header's pace (headless Chrome). */
const WRITE_S = 1.6;
const FILL_S = 0.8;
const FILL_START_S = WRITE_S + 0.15;
const WAITING_OFFSET = 1.05;

const TOTAL_LENGTH = signatureStrokes.reduce((sum, s) => sum + s.length, 0);
const PIECES = signatureStrokes.reduce<{ d: string; delay: number; duration: number }[]>((acc, s) => {
  const prev = acc[acc.length - 1];
  const delay = prev ? prev.delay + prev.duration : 0;
  acc.push({ d: s.d, delay, duration: (WRITE_S * s.length) / TOTAL_LENGTH });
  return acc;
}, []);
// The closed pieces are the letter contours. Each piece starts with an
// absolute M, so joining them gives one valid path.
const LETTERS = signatureStrokes.filter((s) => s.closed).map((s) => s.d).join("");

export default function SignatureMark({ className }: { className: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const reduce = useReducedMotion();
  const [drawn, setDrawn] = useState(false);
  const { x, y, w, h } = signatureBox;
  /* The fill is revealed by a mask: a rect, solid with a soft right edge, that
     slides in from the left. At rest it covers the whole signature with the
     soft edge parked past the right side. The mask region spans both the
     start and end positions so the moving rect is never clipped. */
  const feather = 120;
  const fillW = w + 2 * feather;

  /* `drawn` is deliberately STICKY STATE rather than a value derived from
     `reduce`. Deriving it (`const drawn = reduce || entered`) looks cleaner and
     silences the lint rule below, but it is wrong: `useReducedMotion` tracks the
     preference live, so a visitor turning reduced motion OFF mid-session would
     flip `reduce` to false while nothing had yet reported intersection, and the
     already-visible signature would blink out and redraw. Once revealed, it must
     stay revealed. This was tried and reverted, so do not "simplify" it again. */
  useEffect(() => {
    if (reduce) {
      /* Reduced motion: reveal immediately with no transition. Synchronous
         setState in an effect is exactly what the rule flags, but the sticky
         behaviour described above depends on it and has no derived equivalent. */
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDrawn(true);
      return;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setDrawn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  /* No transition at all until the signature is revealed, then `none` under
     reduced motion. Both halves are load-bearing:
     - The server cannot know the preference, so if the transition were set
       from the first render, the server HTML would carry the animated one and
       the client's `none` would be a hydration mismatch, which React does not
       patch in a style attribute. Observed: reduced-motion pages kept the
       server's transition (headless Chrome, 2026-10-18). Leaving it unset
       until `drawn` makes the server and first client render identical.
     - The global reduced-motion rule in globals.css shortens transition
       durations but not delays, so without `none` the pieces would still
       appear one by one over the full writing time. */
  const transition = (value: string) => (!drawn ? undefined : reduce ? "none" : value);

  return (
    <svg
      ref={ref}
      viewBox={`${x} ${y} ${w} ${h}`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Jacob J. Choi signature"
    >
      <defs>
        {/* In user space across the whole box, so every piece takes its colour
            from where it sits instead of restarting the sweep per piece. */}
        <linearGradient id="sigGrad" gradientUnits="userSpaceOnUse" x1={x} y1="0" x2={x + w} y2="0">
          {SWEEP_STOPS.map((s) => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
        <linearGradient id="sigFeather">
          <stop offset="0" stopColor="#fff" />
          <stop offset={(w + feather) / fillW} stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id="sigFill" maskUnits="userSpaceOnUse" x={x - fillW} y={y} width={2 * fillW} height={h}>
          <rect
            x={x - feather}
            y={y}
            width={fillW}
            height={h}
            fill="url(#sigFeather)"
            style={{
              transform: drawn ? "none" : `translateX(${-fillW}px)`,
              transition: transition(`transform ${FILL_S}s cubic-bezier(.45,0,.35,1) ${FILL_START_S}s`),
            }}
          />
        </mask>
      </defs>
      <path d={LETTERS} fill="url(#sigGrad)" mask="url(#sigFill)" />
      <g fill="none" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        {PIECES.map((p) => (
          <path
            key={p.delay}
            d={p.d}
            stroke="url(#sigGrad)"
            pathLength={1}
            style={{
              strokeDasharray: "1 2",
              strokeDashoffset: drawn ? 0 : WAITING_OFFSET,
              transition: transition(`stroke-dashoffset ${p.duration}s linear ${p.delay}s`),
            }}
          />
        ))}
      </g>
    </svg>
  );
}
