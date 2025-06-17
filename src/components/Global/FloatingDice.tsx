"use client";

import React from 'react';

// Pre-generated static values for consistent performance
const DICE_CONFIG = [
  { size: 45, left: 15, top: 20, delay: 2, duration: 25, opacity: 0.8, color: 'cyan', dots: 3, rotateX: 45, rotateY: 90, rotateZ: 180 },
  { size: 38, left: 75, top: 50, delay: 5, duration: 30, opacity: 0.7, color: 'orange', dots: 6, rotateX: 180, rotateY: 45, rotateZ: 270 },
  { size: 52, left: 25, top: 80, delay: 0, duration: 22, opacity: 0.9, color: 'cyan', dots: 1, rotateX: 270, rotateY: 180, rotateZ: 90 },
  { size: 41, left: 90, top: 15, delay: 7, duration: 28, opacity: 0.6, color: 'orange', dots: 4, rotateX: 90, rotateY: 270, rotateZ: 45 },
  { size: 48, left: 5, top: 65, delay: 3, duration: 26, opacity: 0.8, color: 'cyan', dots: 2, rotateX: 315, rotateY: 135, rotateZ: 225 },
  { size: 35, left: 60, top: 25, delay: 6, duration: 24, opacity: 0.7, color: 'orange', dots: 5, rotateX: 135, rotateY: 315, rotateZ: 315 },
  { size: 50, left: 40, top: 90, delay: 1, duration: 32, opacity: 0.9, color: 'cyan', dots: 6, rotateX: 225, rotateY: 90, rotateZ: 135 },
  { size: 43, left: 85, top: 70, delay: 4, duration: 27, opacity: 0.6, color: 'orange', dots: 3, rotateX: 0, rotateY: 225, rotateZ: 180 },
  { size: 39, left: 10, top: 35, delay: 8, duration: 29, opacity: 0.8, color: 'cyan', dots: 4, rotateX: 180, rotateY: 0, rotateZ: 270 },
  { size: 46, left: 70, top: 10, delay: 2.5, duration: 23, opacity: 0.7, color: 'orange', dots: 1, rotateX: 90, rotateY: 180, rotateZ: 0 },
  { size: 40, left: 30, top: 55, delay: 5.5, duration: 31, opacity: 0.9, color: 'cyan', dots: 5, rotateX: 270, rotateY: 45, rotateZ: 90 },
  { size: 37, left: 95, top: 40, delay: 1.5, duration: 25, opacity: 0.6, color: 'orange', dots: 2, rotateX: 45, rotateY: 270, rotateZ: 315 },
  { size: 44, left: 20, top: 75, delay: 6.5, duration: 28, opacity: 0.8, color: 'cyan', dots: 6, rotateX: 315, rotateY: 90, rotateZ: 225 },
  { size: 42, left: 80, top: 30, delay: 3.5, duration: 26, opacity: 0.7, color: 'orange', dots: 3, rotateX: 135, rotateY: 315, rotateZ: 45 },
  { size: 36, left: 50, top: 85, delay: 7.5, duration: 24, opacity: 0.9, color: 'cyan', dots: 1, rotateX: 225, rotateY: 135, rotateZ: 180 }
];

const FloatingDice: React.FC = () => {
  const dice = DICE_CONFIG;

  const getDotPattern = (dots: number, color: string) => {
    const dotColor = color === 'cyan' ? '#00E5FF' : '#FF6B35';
    const patterns: Record<number, JSX.Element[]> = {
      1: [<div key="center" className="dice-dot" style={{ gridArea: '2 / 2' }} />],
      2: [
        <div key="tl" className="dice-dot" style={{ gridArea: '1 / 1' }} />,
        <div key="br" className="dice-dot" style={{ gridArea: '3 / 3' }} />
      ],
      3: [
        <div key="tl" className="dice-dot" style={{ gridArea: '1 / 1' }} />,
        <div key="center" className="dice-dot" style={{ gridArea: '2 / 2' }} />,
        <div key="br" className="dice-dot" style={{ gridArea: '3 / 3' }} />
      ],
      4: [
        <div key="tl" className="dice-dot" style={{ gridArea: '1 / 1' }} />,
        <div key="tr" className="dice-dot" style={{ gridArea: '1 / 3' }} />,
        <div key="bl" className="dice-dot" style={{ gridArea: '3 / 1' }} />,
        <div key="br" className="dice-dot" style={{ gridArea: '3 / 3' }} />
      ],
      5: [
        <div key="tl" className="dice-dot" style={{ gridArea: '1 / 1' }} />,
        <div key="tr" className="dice-dot" style={{ gridArea: '1 / 3' }} />,
        <div key="center" className="dice-dot" style={{ gridArea: '2 / 2' }} />,
        <div key="bl" className="dice-dot" style={{ gridArea: '3 / 1' }} />,
        <div key="br" className="dice-dot" style={{ gridArea: '3 / 3' }} />
      ],
      6: [
        <div key="tl" className="dice-dot" style={{ gridArea: '1 / 1' }} />,
        <div key="tr" className="dice-dot" style={{ gridArea: '1 / 3' }} />,
        <div key="ml" className="dice-dot" style={{ gridArea: '2 / 1' }} />,
        <div key="mr" className="dice-dot" style={{ gridArea: '2 / 3' }} />,
        <div key="bl" className="dice-dot" style={{ gridArea: '3 / 1' }} />,
        <div key="br" className="dice-dot" style={{ gridArea: '3 / 3' }} />
      ]
    };
    
    return (
      <div 
        className="dice-face"
        style={{
          display: 'grid',
          gridTemplate: '1fr 1fr 1fr / 1fr 1fr 1fr',
          gap: '2px',
          padding: '8px',
          width: '100%',
          height: '100%'
        }}
      >
        {patterns[dots]}
        <style jsx>{`
          .dice-dot {
            background: ${dotColor};
            border-radius: 50%;
            width: 100%;
            height: 100%;
            aspect-ratio: 1;
            box-shadow: 0 0 10px ${dotColor}, 0 0 20px ${dotColor};
          }
        `}</style>
      </div>
    );
  };

  return (
    <>
      <style jsx>{`
        .dice {
          position: absolute;
          border-radius: 8px;
          animation: float var(--duration) infinite linear;
          animation-delay: var(--delay);
          pointer-events: none;
          backdrop-filter: blur(1px);
        }
        
        .dice.cyan {
          background: rgba(0, 20, 40, 0.8);
          border: 2px solid #00E5FF;
          box-shadow: 
            0 0 20px #00E5FF,
            0 0 40px #00E5FF,
            inset 0 0 20px rgba(0, 229, 255, 0.1);
        }
        
        .dice.orange {
          background: rgba(40, 20, 0, 0.8);
          border: 2px solid #FF6B35;
          box-shadow: 
            0 0 20px #FF6B35,
            0 0 40px #FF6B35,
            inset 0 0 20px rgba(255, 107, 53, 0.1);
        }

        @keyframes float {
          0% {
            transform: 
              translateY(100vh) 
              rotateX(var(--rx)) 
              rotateY(var(--ry)) 
              rotateZ(var(--rz));
            opacity: 0;
          }
          10% {
            opacity: var(--opacity);
          }
          90% {
            opacity: var(--opacity);
          }
          100% {
            transform: 
              translateY(-150px) 
              rotateX(calc(var(--rx) + 360deg)) 
              rotateY(calc(var(--ry) + 180deg)) 
              rotateZ(calc(var(--rz) + 360deg));
            opacity: 0;
          }
        }
      `}</style>
      
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}>
        {dice.map((die, index) => (
          <div
            key={index}
            className={`dice ${die.color}`}
            style={{
              width: `${die.size}px`,
              height: `${die.size}px`,
              left: `${die.left}%`,
              top: `${die.top}%`,
              '--delay': `${die.delay}s`,
              '--duration': `${die.duration}s`,
              '--opacity': die.opacity,
              '--rx': `${die.rotateX}deg`,
              '--ry': `${die.rotateY}deg`,
              '--rz': `${die.rotateZ}deg`,
            } as React.CSSProperties & { 
              '--delay': string; 
              '--duration': string; 
              '--opacity': number;
              '--rx': string;
              '--ry': string;
              '--rz': string;
            }}
          >
            {getDotPattern(die.dots, die.color)}
          </div>
        ))}
      </div>
    </>
  );
};

export default FloatingDice;