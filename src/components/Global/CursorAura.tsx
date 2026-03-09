"use client";

import { useEffect, useRef, useState } from "react";

export default function CursorAura() {
  const [mounted, setMounted] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setIsTouch(hasTouch || reducedMotion);
    if (hasTouch || reducedMotion) return;

    const onMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (!mounted || isTouch) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 2,
        overflow: "hidden",
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: "translate(-1000px, -1000px)",
          willChange: "transform",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(167, 139, 250, 0.15) 0%, rgba(167, 139, 250, 0.06) 40%, transparent 70%)",
          }}
        />
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              transform: "translate(-50%, -50%)",
              width: 0,
              height: 0,
              borderRadius: "50%",
              border: `1px solid rgba(167, 139, 250, ${0.2 - i * 0.03})`,
              animation: `aura-pulse 4.5s ease-out ${i * 0.9}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
