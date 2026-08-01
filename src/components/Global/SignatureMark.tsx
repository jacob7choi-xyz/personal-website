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
  const [entered, setEntered] = useState(false);
  const { x, y, w, h } = signatureBox;

  /* Reduced motion is known during render, so it is DERIVED rather than pushed
     into state from an effect. Previously the effect called setDrawn(true) for
     this case, which is a synchronous setState in an effect body: an extra render
     for a fact already available, and flagged by react-hooks/set-state-in-effect.
     Only the observer genuinely needs state, because intersection is not knowable
     until after paint. */
  const drawn = reduce || entered;

  useEffect(() => {
    /* Nothing to observe: the mark is already shown by the derived value above. */
    if (reduce) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      /* Deliberate synchronous setState, and the narrowest remaining case: a
         browser with no IntersectionObserver cannot tell us when the mark scrolls
         into view, so it is revealed immediately rather than never. One extra
         render on a path no current browser takes.
         eslint-disable-next-line react-hooks/set-state-in-effect */
      setEntered(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
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
