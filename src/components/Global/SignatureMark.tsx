"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { signaturePath, signatureBox } from "@/constants/signature";

// The signature path (letters + cursive connectors + flourish) is fully
// generated upstream as one continuous path. We just draw it on with the
// canonical pathLength="1" + stroke-dashoffset technique (no per-frame JS).
const DRAW_MS = 2000;

export default function SignatureMark({ className = "w-full h-auto" }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const reduce = useReducedMotion();
  const [drawn, setDrawn] = useState(false);
  const { x, y, w, h } = signatureBox;

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
        <linearGradient id="sigGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FF9E8A" />
          <stop offset="34%" stopColor="#54E09C" />
          <stop offset="64%" stopColor="#2FD2CE" />
          <stop offset="100%" stopColor="#36ADEE" />
        </linearGradient>
      </defs>
      <path
        d={signaturePath}
        fill="none"
        stroke="url(#sigGrad)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        style={{
          strokeDasharray: 1,
          strokeDashoffset: drawn ? 0 : 1,
          transition: reduce ? "none" : `stroke-dashoffset ${DRAW_MS}ms ease-in-out`,
        }}
      />
    </svg>
  );
}
