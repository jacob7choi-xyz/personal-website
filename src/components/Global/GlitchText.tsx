"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface GlitchTextProps {
  text: string;
  className?: string;
  triggerOnHover?: boolean;
  autoPlay?: boolean;
  delay?: number;
  mode?: 'glitch' | 'smooth'; // New prop to choose effect type
}

const GlitchText: React.FC<GlitchTextProps> = ({ 
  text, 
  className = "", 
  triggerOnHover = false,
  autoPlay = false,
  delay = 0,
  mode = 'glitch'
}) => {
  const [displayText, setDisplayText] = useState(mode === 'smooth' ? '' : text);
  const [isGlitching, setIsGlitching] = useState(false);
  const [revealedChars, setRevealedChars] = useState(0);

  const glitchChars = '!@#$%^&*(){}[]|\\:";\'<>?,./`~';
  const originalText = text;

  // Glitch effect (existing) - wrapped in useCallback
  const glitchEffect = useCallback(() => {
    setIsGlitching(true);
    let iterations = 0;
    const maxIterations = 10;

    const interval = setInterval(() => {
      setDisplayText(() => 
        originalText
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            
            if (iterations > index * 0.5) {
              return originalText[index];
            }
            
            return glitchChars[Math.floor(Math.random() * glitchChars.length)];
          })
          .join('')
      );

      iterations++;

      if (iterations >= maxIterations) {
        clearInterval(interval);
        setDisplayText(originalText);
        setIsGlitching(false);
      }
    }, 50);
  }, [originalText, glitchChars]);

  // Smooth reveal effect (new) - wrapped in useCallback
  const smoothRevealEffect = useCallback(() => {
    const revealInterval = setInterval(() => {
      setRevealedChars(prev => {
        if (prev >= text.length) {
          clearInterval(revealInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 150); // 150ms per character

    return () => clearInterval(revealInterval);
  }, [text.length]);

  useEffect(() => {
    if (autoPlay) {
      const timer = setTimeout(() => {
        if (mode === 'glitch') {
          glitchEffect();
        } else {
          smoothRevealEffect();
        }
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, delay, mode, glitchEffect, smoothRevealEffect]); // Added missing dependencies

  const handleInteraction = () => {
    if (triggerOnHover && !isGlitching && mode === 'glitch') {
      glitchEffect();
    }
  };

  // Render smooth mode
  if (mode === 'smooth') {
    return (
      <span className={className}>
        {text.split('').map((char, index) => {
          const isRevealed = index < revealedChars;
          const isCurrentChar = index === revealedChars - 1;
          
          return (
            <motion.span
              key={index}
              className="inline-block"
              initial={{ 
                opacity: 0, 
                filter: 'blur(8px)',
                scale: 0.8,
                y: 20
              }}
              animate={{ 
                opacity: isRevealed ? 1 : 0,
                filter: isRevealed ? 'blur(0px)' : 'blur(8px)',
                scale: isRevealed ? 1 : 0.8,
                y: isRevealed ? 0 : 20
              }}
              transition={{
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
                delay: 0
              }}
              style={{
                textShadow: isCurrentChar ? '0 0 10px rgba(0, 229, 255, 0.6)' : 'none',
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          );
        })}
      </span>
    );
  }

  // Render glitch mode (existing)
  return (
    <motion.span
      className={`inline-block ${className}`}
      onMouseEnter={handleInteraction}
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        textShadow: isGlitching ? `
          2px 0 #ff0000,
          -2px 0 #00ffff,
          0 2px #ff00ff
        ` : 'none',
        filter: isGlitching ? 'blur(0.5px)' : 'none',
        transform: isGlitching ? 'skew(-2deg)' : 'none',
      }}
      animate={{
        opacity: isGlitching ? [1, 0.8, 1, 0.9, 1] : 1,
        scale: isGlitching ? [1, 1.02, 0.98, 1.01, 1] : 1,
      }}
      transition={{
        duration: isGlitching ? 0.5 : 0.3,
        ease: "easeInOut"
      }}
    >
      {displayText}
    </motion.span>
  );
};

export default GlitchText;