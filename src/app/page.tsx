"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

// Components
import Cursor from "@/components/Global/Cursor";
import GlitchText from "@/components/Global/GlitchText";
import { FaGithub, FaLinkedinIn, FaXTwitter, FaInstagram, FaYoutube } from "react-icons/fa6";

// Constants
import { currentExperience, pastExperience, projects, certifications, socialLinks, personalInfo } from "@/constants";
import { fadeInUp, fadeInScale } from "@/constants/animations";

const socialIcons: Record<string, React.ReactNode> = {
  GitHub: <FaGithub className="text-2xl text-[#c9d1d9]" />,
  LinkedIn: <FaLinkedinIn className="text-2xl text-[#0A66C2]" />,
  X: <FaXTwitter className="text-2xl text-[#e7e9ea]" />,
  Instagram: <FaInstagram className="text-2xl text-[#E4405F]" />,
  YouTube: <FaYoutube className="text-2xl text-[#FF0000]" />,
};

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="text-white min-h-screen font-mono relative overflow-hidden"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>

      {/* Custom Cursor */}
      {mounted && <Cursor />}

      {/* Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid-pattern absolute inset-0" />
      </div>

      {/* Animated Grid Lines */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-30"
              style={{
                top: `${15 + i * 35}%`,
                left: 0,
                right: 0,
                zIndex: 1,
              }}
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 12 + i * 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="container-custom py-16 relative z-10">

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <div className="flex flex-col lg:flex-row items-start gap-12">
            {/* Photo */}
            <motion.div
              {...fadeInScale}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="shrink-0"
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-gray-900 rounded-lg p-1">
                  <Image
                    src="/Jacob_Choi_Headshot.JPG"
                    alt="Jacob Choi"
                    width={280}
                    height={280}
                    className="rounded-lg"
                  />
                </div>
              </div>
              <div className="mt-3 text-center">
                <span className="text-tech text-sm font-mono tracking-wider">
                  Building<span className="animate-pulse">...</span>
                </span>
              </div>
            </motion.div>

            {/* Identity */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="status-online"></div>
                <span className="label text-tech">SYSTEM_ONLINE</span>
              </div>

              <h1 className="heading-1 mb-4">
                <GlitchText
                  text="Jacob J. Choi"
                  mode="smooth"
                  autoPlay={true}
                  delay={800}
                />
              </h1>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="body-large text-muted mb-6"
              >
                {personalInfo.title}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="flex items-center gap-4 text-sm"
              >
                <a
                  href={`mailto:${personalInfo.email}`}
                  className="link focus-ring"
                >
                  {personalInfo.email}
                </a>
                <div className="w-px h-4 bg-gray-600"></div>
                <span className="body-small text-tech">{personalInfo.status}</span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Bio */}
        <motion.div
          {...fadeInUp}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mb-20"
        >
          <div className="card-glass p-8">
            <h2 className="label text-tech mb-4">README.md</h2>
            <div className="body-normal text-muted leading-relaxed space-y-4 max-w-4xl">
              <p dangerouslySetInnerHTML={{
                __html: personalInfo.bio.introLinks
                  ? personalInfo.bio.introLinks.reduce(
                      (text, link) => text.replace(
                        link.text,
                        `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 transition-colors underline">${link.text}</a>`
                      ),
                      personalInfo.bio.intro
                    )
                  : personalInfo.bio.intro
              }} />
              <p>{personalInfo.bio.focus}</p>
            </div>
          </div>
        </motion.div>

        {/* Experience Grid */}
        <motion.div
          {...fadeInUp}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="grid md:grid-cols-3 gap-8 mb-20"
        >
          {/* Current */}
          <motion.div
            className="card-glass p-6"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h3 className="label text-tech mb-4">/current</h3>
            <div className="space-y-4 body-small">
              {currentExperience.map((exp) => (
                <div key={exp.id} className="border-tech">
                  <div className="body-normal font-medium">{exp.title}</div>
                  <div className="text-muted">
                    {exp.link ? (
                      <a href={exp.link} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors underline decoration-gray-600 hover:decoration-gray-400">
                        {exp.company}
                      </a>
                    ) : (
                      exp.company
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Past */}
          <motion.div
            className="card-glass p-6"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h3 className="label text-tech mb-4">/past</h3>
            <div className="space-y-4 body-small">
              {pastExperience.map((exp) => (
                <div key={exp.id} className="border-tech">
                  <div className="body-normal font-medium">
                    {exp.link ? (
                      <a href={exp.link} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors underline decoration-gray-600 hover:decoration-gray-400">
                        {exp.title}
                      </a>
                    ) : (
                      exp.title
                    )}
                  </div>
                  <div className="text-muted">
                    {exp.items ? (
                      <ul className="list-disc list-inside space-y-1">
                        {exp.items.map((item, i) => (
                          <li key={i}>
                            {item.link ? (
                              <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors underline decoration-gray-600 hover:decoration-gray-400">
                                {item.text}
                              </a>
                            ) : (
                              item.text
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      exp.company
                    )}
                  </div>
                  {exp.mentorLink && (
                    <div className="text-xs mt-1">
                      <a href={exp.mentorLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-200 transition-colors underline decoration-gray-600 hover:decoration-gray-400">
                        {exp.mentorText}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Certificates */}
          <motion.div
            className="card-glass p-6"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h3 className="label text-tech mb-4">/certificates</h3>
            <div className="space-y-4 body-small">
              {certifications.map((cert) => (
                <div key={cert.id} className="border-tech">
                  <div className="body-normal font-medium">
                    {cert.link ? (
                      <a href={cert.link} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors underline decoration-gray-600 hover:decoration-gray-400">
                        {cert.title}
                      </a>
                    ) : (
                      cert.title
                    )}
                  </div>
                  <div className="text-muted">{cert.issuer}</div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-400">{cert.year}</span>
                    <span className={`
                      ${cert.status === 'Completed' ? 'text-green-400' :
                        cert.status === 'In Progress' ? 'text-yellow-400' :
                        'text-gray-400'}
                    `}>
                      {cert.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Projects */}
        <motion.div
          {...fadeInUp}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mb-20"
        >
          <h2 className="label text-tech mb-6">/projects</h2>
          <div className="space-y-4">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                className="card-glass p-5 group flex flex-col md:flex-row md:items-center gap-4"
                whileHover={{ x: 5, borderColor: 'rgba(0, 229, 255, 0.4)' }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="body-normal font-semibold">
                      {project.link ? (
                        <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                          {project.title}
                          <span className="text-xs ml-1 opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                        </a>
                      ) : (
                        project.title
                      )}
                    </h3>
                  </div>
                  <div className="text-muted body-small">
                    {project.descriptionLink ? (
                      <span dangerouslySetInnerHTML={{
                        __html: project.description.replace(
                          project.descriptionLink.text,
                          `<a href="${project.descriptionLink.url}" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 transition-colors underline">${project.descriptionLink.text}</a>`
                        )
                      }} />
                    ) : (
                      project.description
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 md:justify-end shrink-0">
                  {project.tech.split(", ").map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded border border-cyan-400/20 text-cyan-400/70 bg-cyan-400/5 whitespace-nowrap">
                      {t}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Social Links */}
        <motion.div
          {...fadeInUp}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex flex-wrap items-center gap-8 mb-20"
        >
          {socialLinks.map((social) => (
            <motion.a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-cyan-400 transition-colors duration-300 focus-ring"
              whileHover={{ y: -3, scale: 1.15 }}
              transition={{ type: "spring", stiffness: 300 }}
              title={social.name}
            >
              {socialIcons[social.name]}
            </motion.a>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="pt-8 border-t border-gray-800"
        >
          <div className="flex-between body-small text-subtle">
            <div>© 2026 Jacob J. Choi</div>
            <div className="flex-center gap-2">
              <div className="status-online"></div>
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
