"use client";

import React, { useEffect, useRef } from "react";

const Cursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        const x = e.clientX;
        const y = e.clientY;
        
        // Center the 24px cursor on mouse position
        cursorRef.current.style.left = `${x - 12}px`;
        cursorRef.current.style.top = `${y - 12}px`;
        cursorRef.current.style.display = "block";
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (cursorRef.current && (!e.relatedTarget || e.relatedTarget === null)) {
        cursorRef.current.style.display = "none";
      }
    };

    // Only add cursor on non-touch devices
    if (!("ontouchstart" in window || navigator.maxTouchPoints)) {
      document.addEventListener("mousemove", moveCursor);
      document.addEventListener("mouseout", handleMouseOut);
    }

    return () => {
      document.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed z-50"
      style={{
        left: "0px",
        top: "0px",
        display: "none",
        mixBlendMode: "difference"
      }}
    >
      {/* Tech Cursor SVG */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer crosshair */}
        <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round"/>
        
        {/* Inner tech elements */}
        <circle cx="12" cy="12" r="3" stroke="#00E5FF" strokeWidth="1.5" fill="none"/>
        <circle cx="12" cy="12" r="1" fill="#00E5FF"/>
        
        {/* Corner tech details */}
        <path d="M7 7L9 9M17 7L15 9M7 17L9 15M17 17L15 15" stroke="#00E5FF" strokeWidth="1" strokeLinecap="round"/>
        
        {/* Circuit-like elements */}
        <rect x="10.5" y="8" width="3" height="1" fill="#00E5FF" opacity="0.7"/>
        <rect x="10.5" y="15" width="3" height="1" fill="#00E5FF" opacity="0.7"/>
        <rect x="8" y="10.5" width="1" height="3" fill="#00E5FF" opacity="0.7"/>
        <rect x="15" y="10.5" width="1" height="3" fill="#00E5FF" opacity="0.7"/>
      </svg>
    </div>
  );
};

export default Cursor;