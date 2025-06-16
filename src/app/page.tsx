"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cursorVariant, setCursorVariant] = useState("default");
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = () => setCursorVariant("hover");
    const handleMouseLeave = () => setCursorVariant("default");

    // Add event listeners to interactive elements after mount
    if (mounted) {
      const interactiveElements = document.querySelectorAll('a, button, [role="button"]');
      interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', handleMouseEnter);
        el.addEventListener('mouseleave', handleMouseLeave);
      });

      window.addEventListener('mousemove', updateMousePosition);

      return () => {
        window.removeEventListener('mousemove', updateMousePosition);
        interactiveElements.forEach(el => {
          el.removeEventListener('mouseenter', handleMouseEnter);
          el.removeEventListener('mouseleave', handleMouseLeave);
        });
      };
    }
  }, [mounted]);

  const variants = {
    default: {
      x: mousePosition.x - 6,
      y: mousePosition.y - 6,
      scale: 1,
      opacity: 1,
    },
    hover: {
      x: mousePosition.x - 12,
      y: mousePosition.y - 12,
      scale: 2,
      opacity: 0.8,
    }
  };

  return (
    <div className="bg-black text-white min-h-screen font-mono relative overflow-hidden">
      
      {/* Custom Cursor - Only show after mount */}
      {mounted && (
        <motion.div
          className="fixed top-0 left-0 w-3 h-3 bg-cyan-400 rounded-full pointer-events-none z-50"
          variants={variants}
          animate={cursorVariant}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 28,
            mass: 0.5,
          }}
          style={{
            mixBlendMode: 'difference'
          }}
        />
      )}

      {/* Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px'
        }} />
      </div>

      {/* Animated Grid Lines - Only render after mount */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-30"
              style={{
                top: `${20 + i * 20}%`,
                left: 0,
                right: 0,
              }}
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-8 py-16">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm tracking-wider">SYSTEM_ONLINE</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="text-white">Jacob</span>
            <span className="text-cyan-400">.</span>
            <span className="text-white">Choi</span>
          </h1>
          
          <div className="text-xl text-gray-300 mb-8 max-w-2xl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Full-Stack Developer • AI Engineer • Entrepreneur
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex items-center gap-4"
          >
            <a 
              href="mailto:jchoi26@colby.edu"
              className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200 tracking-wide"
            >
              jchoi26@colby.edu
            </a>
            <div className="w-px h-4 bg-gray-600"></div>
            <span className="text-gray-500 text-sm">Available for opportunities</span>
          </motion.div>
        </motion.div>

        {/* Profile and Bio Section */}
        <div className="grid lg:grid-cols-3 gap-12 mb-20">
          
          {/* Profile Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="lg:col-span-1"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-gray-900 rounded-lg p-1">
                <Image
                  src="/Jacob_Choi_Headshot.JPG"
                  alt="Jacob Choi"
                  width={300}
                  height={300}
                  className="rounded-lg w-full"
                />
              </div>
            </div>
          </motion.div>

          {/* Bio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-6">
              <h2 className="text-cyan-400 text-sm uppercase tracking-widest mb-4">README.md</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  Twenty-two year old product visionary building the future of music technology. 
                  Currently developing TuneTales, an AI-powered storytelling platform that transforms 
                  how people connect with music and artists.
                </p>
                <p>
                  Combining musical artistry, international perspective, and AI expertise to create 
                  products that bridge the gap between technology and human creativity. 
                  Passionate about empowering artists and deepening fan connections through innovative experiences.
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-4">
                <div className="text-cyan-400 text-2xl font-bold">4+</div>
                <div className="text-gray-400 text-sm">Active Projects</div>
              </div>
              <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-4">
                <div className="text-cyan-400 text-2xl font-bold">22</div>
                <div className="text-gray-400 text-sm">Years Old</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Experience Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="grid md:grid-cols-3 gap-8 mb-20"
        >
          
          {/* Currently */}
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-6 hover:border-cyan-500/50 transition-colors duration-300">
            <h3 className="text-cyan-400 text-sm uppercase tracking-widest mb-4">/current</h3>
            <div className="space-y-4 text-sm">
              <div className="border-l-2 border-cyan-500 pl-4">
                <div className="text-white font-medium">Computer Science: AI</div>
                <div className="text-gray-400">Colby College</div>
              </div>
              <div className="border-l-2 border-cyan-500 pl-4">
                <div className="text-white font-medium">Founder/CEO/Product Lead</div>
                <div className="text-gray-400">TuneTales - AI Music Storytelling Platform</div>
              </div>
              <div className="border-l-2 border-cyan-500 pl-4">
                <div className="text-white font-medium">AI Software Engineer</div>
                <div className="text-gray-400">Maine Cancer Genomics Initiative @ Jackson Lab</div>
              </div>
              <div className="border-l-2 border-cyan-500 pl-4">
                <div className="text-white font-medium">AI Research Collaborator</div>
                <div className="text-gray-400">Microsoft Research - Turing Test Extension</div>
              </div>
            </div>
          </div>

          {/* Past */}
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-6 hover:border-cyan-500/50 transition-colors duration-300">
            <h3 className="text-cyan-400 text-sm uppercase tracking-widest mb-4">/history</h3>
            <div className="space-y-4 text-sm">
              <div className="border-l-2 border-cyan-500 pl-4">
                <div className="text-white font-medium">AI/ML Research Intern</div>
                <div className="text-gray-400">USC Institute for Creative Technologies</div>
              </div>
              <div className="border-l-2 border-cyan-500 pl-4">
                <div className="text-white font-medium">Legal Intern</div>
                <div className="text-gray-400">Shin & Kim Law Firm, Seoul</div>
              </div>
              <div className="border-l-2 border-cyan-500 pl-4">
                <div className="text-white font-medium">Investment Analyst Intern</div>
                <div className="text-gray-400">Colby College Endowment</div>
              </div>
              <div className="border-l-2 border-cyan-500 pl-4">
                <div className="text-white font-medium">Entrepreneurship Competitions</div>
                <div className="text-gray-400">Semi-Finalist Greenlight Maine, 1st Place Colby BOTN</div>
              </div>
              <div className="border-l-2 border-cyan-500 pl-4">
                <div className="text-white font-medium">Musician & Performer</div>
                <div className="text-gray-400">Juilliard Admission, NPR "From The Top"</div>
              </div>
            </div>
          </div>

          {/* Projects */}
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-6 hover:border-cyan-500/50 transition-colors duration-300">
            <h3 className="text-cyan-400 text-sm uppercase tracking-widest mb-4">/projects</h3>
            <div className="space-y-4 text-sm">
              <div className="border-l-2 border-cyan-500 pl-4">
                <div className="text-white font-medium">TuneTales</div>
                <div className="text-gray-400">AI-powered music storytelling & artist discovery platform</div>
                <div className="text-xs text-cyan-400 mt-1">Next.js, Python, Claude API, Real-time Personalization</div>
              </div>
              <div className="border-l-2 border-cyan-500 pl-4">
                <div className="text-white font-medium">HarmonyRestorer</div>
                <div className="text-gray-400">AI audio restoration and enhancement platform</div>
                <div className="text-xs text-cyan-400 mt-1">PyTorch, Meta Demucs, Flask, Audio Processing</div>
              </div>
              <div className="border-l-2 border-cyan-500 pl-4">
                <div className="text-white font-medium">Turing Test Experiments</div>
                <div className="text-gray-400">AI-human interaction research</div>
                <div className="text-xs text-cyan-400 mt-1">GPT-4, Claude, Prompt Engineering</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex flex-wrap gap-6"
        >
          {[
            { name: "GitHub", url: "https://github.com/jacob7choi-xyz" },
            { name: "LinkedIn", url: "https://www.linkedin.com/in/jacobjchoi/" },
            { name: "X", url: "https://x.com/jacob7choii" },
            { name: "Instagram", url: "https://www.instagram.com/jacob7choi/" }
          ].map((social) => (
            <motion.a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors duration-200"
              whileHover={{ x: 5 }}
            >
              <span>{social.name}</span>
              <span className="text-xs">↗</span>
            </motion.a>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-20 pt-8 border-t border-gray-800"
        >
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>© 2025 Jacob J. Choi</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Built with Next.js & Framer Motion</span>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        * {
          cursor: none;
        }
      `}</style>
    </div>
  );
}