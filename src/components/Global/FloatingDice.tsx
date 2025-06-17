"use client";

import React from 'react';

// Function to generate random dice configurations (called once at module load)
const generateDice = (count: number) => {
  // Use a simple seed-based random for consistent results
  let seed = 12345;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  const colors = ['cyan', 'orange'];
  
  return Array.from({ length: count }, (_, i) => {
    // Determine layer based on index for good distribution
    const layer = i < 3 ? 'front' : i < 8 ? 'mid' : 'back';
    
    // Size based on layer
    const sizeRanges = {
      front: { min: 45, max: 55 },
      mid: { min: 30, max: 40 },
      back: { min: 15, max: 25 }
    };
    const { min, max } = sizeRanges[layer as keyof typeof sizeRanges];
    
    return {
      size: Math.floor(random() * (max - min + 1)) + min,
      left: Math.floor(random() * 95) + 2, // 2-97% to avoid edges
      delay: random() * 10, // 0-10s random delay
      duration: Math.floor(random() * 15) + 20, // 20-35s duration
      color: colors[Math.floor(random() * colors.length)] as 'cyan' | 'orange',
      dots: Math.floor(random() * 6) + 1, // 1-6 dots
      layer: layer as 'front' | 'mid' | 'back'
    };
  });
};

// Generate 20 random dice at module load time (not during render)
const DICE_CONFIG = generateDice(40);

const FloatingDice: React.FC = () => {
  // Simple dot patterns - just show dots in key positions
  const getDots = (count: number, color: string) => {
    const positions = [
      [4], // 1: center
      [0, 8], // 2: corners
      [0, 4, 8], // 3: diagonal
      [0, 2, 6, 8], // 4: corners
      [0, 2, 4, 6, 8], // 5: corners + center
      [0, 1, 2, 6, 7, 8] // 6: two columns
    ];
    
    return Array.from({ length: 9 }, (_, i) => (
      <div
        key={i}
        className={positions[count - 1].includes(i) ? `dot ${color}` : ''}
      />
    ));
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
          display: grid;
          grid-template: 1fr 1fr 1fr / 1fr 1fr 1fr;
          gap: 3px;
          padding: 6px;
          box-sizing: border-box;
        }
        
        /* Layer-based performance optimization */
        .dice.front {
          opacity: 0.8;
          z-index: -1;
        }
        
        .dice.mid {
          opacity: 0.6;
          z-index: -2;
        }
        
        .dice.back {
          opacity: 0.3;
          z-index: -3;
          animation-duration: calc(var(--duration) * 1.2); /* Slower movement */
        }
        
        .dice.cyan {
          background: rgba(0, 10, 30, 0.9);
          border: 2px solid #00FFFF;
          box-shadow: 0 0 15px #00FFFF;
        }
        
        .dice.orange {
          background: rgba(30, 10, 0, 0.9);
          border: 2px solid #FF4500;
          box-shadow: 0 0 15px #FF4500;
        }
        
        /* Simplified dots for background layer */
        .dice.back .dot {
          border-radius: 50%;
          width: 80%;
          height: 80%;
          margin: auto;
        }
        
        .dot {
          border-radius: 50%;
          width: 100%;
          height: 100%;
        }
        
        .dot.cyan {
          background: #00FFFF;
          box-shadow: 0 0 4px #00FFFF;
        }
        
        .dot.orange {
          background: #FF4500;
          box-shadow: 0 0 4px #FF4500;
        }
        
        /* Reduce glow for background dice */
        .dice.back.cyan {
          box-shadow: 0 0 8px #00FFFF;
        }
        
        .dice.back.orange {
          box-shadow: 0 0 8px #FF4500;
        }

        @keyframes float {
          from {
            transform: translateY(100vh) rotate(0deg);
          }
          to {
            transform: translateY(-100px) rotate(360deg);
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
        {DICE_CONFIG.map((die, index) => (
          <div
            key={index}
            className={`dice ${die.color} ${die.layer}`}
            style={{
              width: die.size,
              height: die.size,
              left: `${die.left}%`,
              '--delay': `${die.delay}s`,
              '--duration': `${die.duration}s`,
            } as React.CSSProperties & { '--delay': string; '--duration': string }}
          >
            {getDots(die.dots, die.color)}
          </div>
        ))}
      </div>
    </>
  );
};

export default FloatingDice;