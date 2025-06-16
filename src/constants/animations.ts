// Accessibility check for reduced motion
const prefersReducedMotion = () => {
  // ensure we are in the client environment (to avoid Vercel errors)
  if (typeof window !== "undefined") {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  // return a default value when not in a client environment (e.g., during SSR)
  return false;
}

// Tech-inspired animation variants
export const animations = {
  // System boot sequence - elements appear like a computer starting up
  systemBoot: {
    containerVariants: {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          delayChildren: prefersReducedMotion() ? 0.1 : 0.5,
          staggerChildren: 0.15, // tech startup sequence timing
        },
      },
    },
    itemVariants: {
      hidden: { 
        y: 10, 
        opacity: 0,
        scale: 0.98,
        filter: "blur(2px)"
      },
      show: {
        y: 0,
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        transition: {
          type: 'spring',
          stiffness: 200,
          damping: 25,
          opacity: { duration: 0.4 },
          filter: { duration: 0.6 }
        },
      },
    },
  },

  // Circuit-like data flow animations
  dataFlow: {
    containerVariants: {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          delayChildren: prefersReducedMotion() ? 0.2 : 1,
          staggerChildren: 0.08,
        },
      },
    },
    itemVariants: {
      hidden: { 
        x: -30, 
        opacity: 0,
        scaleX: 0.5
      },
      show: {
        x: 0,
        opacity: 1,
        scaleX: 1,
        transition: {
          type: 'spring',
          stiffness: 150,
          damping: 15,
          opacity: { duration: 0.3 },
        },
      },
    },
  },

  // Holographic projection effect
  hologram: {
    containerVariants: {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          delayChildren: prefersReducedMotion() ? 0.1 : 0.8,
          staggerChildren: 0.12,
        },
      },
    },
    itemVariants: {
      hidden: { 
        y: 20, 
        opacity: 0,
        rotateX: -15,
        transformPerspective: 1000
      },
      show: {
        y: 0,
        opacity: 1,
        rotateX: 0,
        transition: {
          type: 'spring',
          stiffness: 120,
          damping: 20,
          opacity: { duration: 0.5 },
        },
      },
    },
  },

  // Neural network activation
  neuralNetwork: {
    containerVariants: {
      hidden: {},
      show: {
        transition: {
          delayChildren: prefersReducedMotion() ? 0.1 : 0.3,
          staggerChildren: 0.05,
        },
      },
    },
    itemVariants: {
      hidden: { 
        scale: 0.8,
        opacity: 0,
        rotateY: -90
      },
      show: {
        scale: 1,
        opacity: 1,
        rotateY: 0,
        transition: {
          type: 'spring',
          stiffness: 180,
          damping: 12,
          opacity: { duration: 0.4 },
        },
      },
    },
  },

  // Quantum effect - elements phase in from different dimensions
  quantum: {
    containerVariants: {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          delayChildren: prefersReducedMotion() ? 0.1 : 0.6,
          staggerChildren: 0.1,
        },
      },
    },
    itemVariants: {
      hidden: { 
        scale: 0.3,
        opacity: 0,
        rotate: 180,
        filter: "brightness(0.3)"
      },
      show: {
        scale: 1,
        opacity: 1,
        rotate: 0,
        filter: "brightness(1)",
        transition: {
          type: 'spring',
          stiffness: 100,
          damping: 18,
          rotate: { duration: 0.8 },
          filter: { duration: 1 }
        },
      },
    },
  },
};

// Individual animation presets (your current ones but enhanced)
export const fadeInUp = {
  initial: { opacity: 0, y: 20, filter: "blur(1px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { 
    duration: prefersReducedMotion() ? 0.2 : 0.8,
    type: "spring",
    stiffness: 100,
    damping: 15
  }
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -20, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1 },
  transition: { 
    duration: prefersReducedMotion() ? 0.2 : 0.8,
    type: "spring",
    stiffness: 120,
    damping: 20
  }
};

export const fadeInScale = {
  initial: { opacity: 0, scale: 0.8, rotateX: -10 },
  animate: { opacity: 1, scale: 1, rotateX: 0 },
  transition: { 
    duration: prefersReducedMotion() ? 0.2 : 0.8,
    type: "spring",
    stiffness: 150,
    damping: 25
  }
};

export const techGlow = {
  initial: { 
    opacity: 0, 
    scale: 0.9,
    boxShadow: "0 0 0 rgba(0, 229, 255, 0)"
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    boxShadow: "0 0 20px rgba(0, 229, 255, 0.3)"
  },
  transition: { 
    duration: prefersReducedMotion() ? 0.2 : 1.2,
    boxShadow: { duration: 2, repeat: Infinity, repeatType: "reverse" }
  }
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: prefersReducedMotion() ? 0.05 : 0.1
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

export const hoverLift = {
  whileHover: { 
    y: -5, 
    scale: 1.02,
    boxShadow: "0 10px 30px rgba(0, 229, 255, 0.2)"
  },
  transition: { 
    type: "spring", 
    stiffness: 300,
    damping: 20
  }
};

export const hoverSlide = {
  whileHover: { 
    x: 5,
    color: "rgb(0, 229, 255)"
  },
  transition: { duration: 0.2 }
};

export const matrixRain = {
  animate: {
    y: [0, 100],
    opacity: [0, 1, 0],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "linear"
  }
};