"use client";

import { useEffect, useRef, useState } from "react";
import { signaturePath, signatureBox } from "@/constants/signature";

// The signature path (letters + cursive connectors + flourish) is fully
// generated upstream as one continuous path. We just draw it on.
const DRAW_MS = 2000;

export default function SignatureMark({ className = "w-full h-auto" }: { className?: string }) {
  const ref = useRef<SVGPathElement>(null);
  const [drawn, setDrawn] = useState(false);
  const [reduce, setReduce] = useState(false);
  const { x, y, w, h } = signatureBox;

  useEffect(() => {
    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (r) {
      setReduce(true);
      setDrawn(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
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
  }, []);

  return (
    <svg
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
      {/* pathLength="1" normalizes the whole path so dasharray/offset is exact
          across all subpaths -> reveals L->R, lands perfectly solid (no gap). */}
      <path
        ref={ref}
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
