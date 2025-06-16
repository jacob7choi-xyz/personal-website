"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

// Components
import Cursor from "@/components/Global/Cursor";
import Header from "@/components/Home/Header";

// Constants
import { currentExperience, pastExperience, projects } from "@/constants/experience";
import { socialLinks, personalInfo } from "@/constants/socials";
import { fadeInUp, fadeInScale, hoverLift, hoverSlide } from "@/constants/animations";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-black text-white min-h-screen font-mono relative overflow-hidden">
      
      {/* Custom Cursor */}
      {mounted && <Cursor />}

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

      {/* Animated Grid Lines */}
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
        <Header />

        {/* Profile and Bio Section */}
        <div className="grid lg:grid-cols-3 gap-12 mb-20">
          
          {/* Profile Image */}
          <motion.div
            {...fadeInScale}
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
            {...fadeInUp}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-6">
              <h2 className="text-cyan-400 text-sm uppercase tracking-widest mb-4">README.md</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>{personalInfo.bio.intro}</p>
                <p>{personalInfo.bio.focus}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-4">
                <div className="text-cyan-400 text-2xl font-bold">{personalInfo.activeProjects}+</div>
                <div className="text-gray-400 text-sm">Active Projects</div>
              </div>
              <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-4">
                <div className="text-cyan-400 text-2xl font-bold">{personalInfo.age}</div>
                <div className="text-gray-400 text-sm">Years Old</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Experience Grid */}
        <motion.div
          {...fadeInUp}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="grid md:grid-cols-3 gap-8 mb-20"
        >
          
          {/* Currently */}
          <motion.div 
            className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-6 hover:border-cyan-500/50 transition-colors duration-300"
            {...hoverLift}
          >
            <h3 className="text-cyan-400 text-sm uppercase tracking-widest mb-4">/current</h3>
            <div className="space-y-4 text-sm">
              {currentExperience.map((exp) => (
                <div key={exp.id} className="border-l-2 border-cyan-500 pl-4">
                  <div className="text-white font-medium">{exp.title}</div>
                  <div className="text-gray-400">{exp.company}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Past */}
          <motion.div 
            className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-6 hover:border-cyan-500/50 transition-colors duration-300"
            {...hoverLift}
          >
            <h3 className="text-cyan-400 text-sm uppercase tracking-widest mb-4">/history</h3>
            <div className="space-y-4 text-sm">
              {pastExperience.map((exp) => (
                <div key={exp.id} className="border-l-2 border-cyan-500 pl-4">
                  <div className="text-white font-medium">{exp.title}</div>
                  <div className="text-gray-400">{exp.company}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Projects */}
          <motion.div 
            className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-6 hover:border-cyan-500/50 transition-colors duration-300"
            {...hoverLift}
          >
            <h3 className="text-cyan-400 text-sm uppercase tracking-widest mb-4">/projects</h3>
            <div className="space-y-4 text-sm">
              {projects.map((project) => (
                <div key={project.id} className="border-l-2 border-cyan-500 pl-4">
                  <div className="text-white font-medium">{project.title}</div>
                  <div className="text-gray-400">{project.description}</div>
                  <div className="text-xs text-cyan-400 mt-1">{project.tech}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Social Links */}
        <motion.div
          {...fadeInUp}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex flex-wrap gap-6"
        >
          {socialLinks.map((social) => (
            <motion.a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors duration-200"
              {...hoverSlide}
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