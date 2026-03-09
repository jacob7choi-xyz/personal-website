"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { FaGithub, FaLinkedinIn, FaXTwitter, FaInstagram, FaYoutube } from "react-icons/fa6";

import { currentExperience, pastExperience, projects, certifications, socialLinks, personalInfo } from "@/constants";

const socialIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  GitHub: { icon: <FaGithub />, color: "#f0f0f0" },
  LinkedIn: { icon: <FaLinkedinIn />, color: "#0A66C2" },
  X: { icon: <FaXTwitter />, color: "#f0f0f0" },
  Instagram: { icon: <FaInstagram />, color: "#E4405F" },
  YouTube: { icon: <FaYoutube />, color: "#FF0000" },
};

const ease = [0.25, 0.1, 0.25, 1] as const;

const fadeVariants = {
  enter: { opacity: 0, filter: "blur(14px)", scale: 0.98 },
  center: { opacity: 1, filter: "blur(0px)", scale: 1 },
  exit: { opacity: 0, filter: "blur(14px)", scale: 0.98 },
};

const TOTAL_SLIDES = 14;

function Slide({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={fadeVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.9, ease }}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "56rem", margin: "0 auto" }}>
        {children}
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [current, setCurrent] = useState(0);
  const lockRef = useRef(false);
  const touchStartRef = useRef(0);

  const go = useCallback((direction: 1 | -1) => {
    if (lockRef.current) return;
    setCurrent((prev) => {
      const next = prev + direction;
      if (next < 0 || next >= TOTAL_SLIDES) return prev;
      lockRef.current = true;
      setTimeout(() => { lockRef.current = false; }, 1000);
      return next;
    });
  }, []);

  const goTo = useCallback((index: number) => {
    if (lockRef.current || index < 0 || index >= TOTAL_SLIDES) return;
    lockRef.current = true;
    setTimeout(() => { lockRef.current = false; }, 900);
    setCurrent(index);
  }, []);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) < 15) return;
      go(e.deltaY > 0 ? 1 : -1);
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartRef.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const delta = touchStartRef.current - e.changedTouches[0].clientY;
      if (Math.abs(delta) < 50) return;
      go(delta > 0 ? 1 : -1);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); go(1); }
      if (e.key === "ArrowUp") { e.preventDefault(); go(-1); }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [go]);

  return (
    <div style={{ background: "var(--bg-primary)", height: "100vh", overflow: "hidden" }}>

      {/* Dot indicators */}
      <div style={{
        position: "fixed", right: "2rem", top: "50%", transform: "translateY(-50%)",
        zIndex: 10, display: "flex", flexDirection: "column", gap: "12px",
      }}>
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: 6,
              height: i === current ? 24 : 6,
              borderRadius: 3,
              background: i === current ? "var(--accent)" : "var(--text-tertiary)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
              opacity: i === current ? 1 : 0.5,
              padding: 0,
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {current === 0 && (
          <Slide key="hero">
            <h1 className="display mb-8">{personalInfo.name}</h1>
            <p className="body-large mb-10 max-w-xl" style={{ color: "var(--text-secondary)" }}>
              {personalInfo.title}
            </p>
            <div>
              <a href={`mailto:${personalInfo.email}`} className="accent-link body-large focus-ring">
                {personalInfo.email}
              </a>
            </div>
            <div className="flex items-center gap-8 mt-12">
              {socialLinks.map((social) => {
                const s = socialIcons[social.name];
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-3xl social-icon focus-ring"
                    style={{ color: s?.color }}
                    title={social.name}
                  >
                    {s?.icon}
                  </a>
                );
              })}
            </div>
          </Slide>
        )}

        {current === 1 && (
          <Slide key="quote">
            <div className="flex items-center justify-center" style={{ minHeight: "40vh" }}>
              <p
                className="text-4xl md:text-6xl lg:text-7xl font-light italic tracking-tight text-center"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-tertiary)" }}
              >
                {personalInfo.status.replace(/"/g, "")}
              </p>
            </div>
          </Slide>
        )}

        {current === 2 && (
          <Slide key="journey-1">
            <p
              className="text-3xl md:text-5xl font-light tracking-tight text-center"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-secondary)" }}
            >
              A little bit about me...
            </p>
          </Slide>
        )}

        {current === 3 && (
          <Slide key="journey-2">
            <p
              className="text-2xl md:text-4xl font-light leading-relaxed tracking-tight text-center"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-secondary)" }}
            >
              Got into Juilliard for viola. Chose Colby to figure out what I really wanted.
            </p>
          </Slide>
        )}

        {current === 4 && (
          <Slide key="journey-3">
            <p
              className="text-2xl md:text-4xl font-light leading-relaxed tracking-tight text-center"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-secondary)" }}
            >
              Double majored in economics and Spanish. Tried finance. Tried law.
            </p>
          </Slide>
        )}

        {current === 5 && (
          <Slide key="journey-4">
            <p
              className="text-2xl md:text-4xl font-light leading-relaxed tracking-tight text-center"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-secondary)" }}
            >
              None of it felt right.
            </p>
          </Slide>
        )}

        {current === 6 && (
          <Slide key="journey-5">
            <p
              className="text-2xl md:text-4xl font-light leading-relaxed tracking-tight text-center"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-secondary)" }}
            >
              Then I tried coding.
            </p>
          </Slide>
        )}

        {current === 7 && (
          <Slide key="journey-6">
            <p
              className="text-xl md:text-3xl font-light leading-relaxed tracking-tight text-center"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-secondary)" }}
            >
              Now I&apos;m building a production agentic system and biomedical GraphRAG corpus for rural patients in Maine and North Carolina, helping clinicians identify the right cancer treatment for each patient. Sponsored by the Duke Endowment.
            </p>
          </Slide>
        )}

        {current === 8 && (
          <Slide key="about">
            <p className="caption mb-12">In Detail</p>
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="body-large space-y-6" style={{ color: "var(--text-secondary)" }}>
                <p dangerouslySetInnerHTML={{
                  __html: personalInfo.bio.introLinks
                    ? personalInfo.bio.introLinks.reduce(
                        (text: string, link: { text: string; url: string }) =>
                          text.replace(link.text, `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="accent-link">${link.text}</a>`),
                        personalInfo.bio.intro
                      )
                    : personalInfo.bio.intro,
                }} />
                <p dangerouslySetInnerHTML={{
                  __html: personalInfo.bio.focusLinks
                    ? personalInfo.bio.focusLinks.reduce(
                        (text: string, link: { text: string; url: string }) =>
                          text.replace(link.text, `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="accent-link">${link.text}</a>`),
                        personalInfo.bio.focus
                      )
                    : personalInfo.bio.focus,
                }} />
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="headshot-wrapper relative w-80 lg:w-full max-w-md">
                  <div className="headshot-glow" />
                  <Image src="/Jacob_Choi_Headshot.JPG" alt="Jacob Choi" width={500} height={500} className="rounded-2xl w-full relative z-10" />
                </div>
              </div>
            </div>
          </Slide>
        )}

        {current === 9 && (
          <Slide key="exp-now">
            <p className="caption mb-4">Experience</p>
            <h3 className="heading-3 mb-12">Current</h3>
            <div className="space-y-10">
              {currentExperience.map((exp) => (
                <div key={exp.id} className="grid md:grid-cols-[220px_1fr] gap-2 md:gap-10">
                  <div className="body-small" style={{ color: "var(--text-tertiary)" }}>{exp.title}</div>
                  <div className="body" style={{ color: "var(--text-primary)" }}>
                    {exp.link ? (
                      <a href={exp.link} target="_blank" rel="noopener noreferrer" className="subtle-link">{exp.company}</a>
                    ) : exp.company}
                  </div>
                </div>
              ))}
            </div>
          </Slide>
        )}

        {current === 10 && (
          <Slide key="exp-prev">
            <p className="caption mb-4">Experience</p>
            <h3 className="heading-3 mb-12">Previously</h3>
            <div className="space-y-10">
              {pastExperience.map((exp) => (
                <div key={exp.id} className="grid md:grid-cols-[220px_1fr] gap-2 md:gap-10">
                  <div className="body-small" style={{ color: "var(--text-tertiary)" }}>
                    {exp.link ? (
                      <a href={exp.link} target="_blank" rel="noopener noreferrer" className="subtle-link">{exp.title}</a>
                    ) : exp.title}
                  </div>
                  <div>
                    <div className="body" style={{ color: "var(--text-primary)" }}>
                      {exp.items ? (
                        <ul className="space-y-1">
                          {exp.items.map((item, j) => (
                            <li key={j}>
                              {item.link ? (
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="subtle-link">{item.text}</a>
                              ) : item.text}
                            </li>
                          ))}
                        </ul>
                      ) : exp.company}
                    </div>
                    {exp.mentorLink && (
                      <a href={exp.mentorLink} target="_blank" rel="noopener noreferrer" className="accent-link body-small mt-2 inline-block">
                        {exp.mentorText}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Slide>
        )}

        {current === 11 && (
          <Slide key="creds">
            <p className="caption mb-4">Experience</p>
            <h3 className="heading-3 mb-12">Credentials</h3>
            <div className="space-y-10">
              {certifications.map((cert) => (
                <div key={cert.id} className="grid md:grid-cols-[220px_1fr] gap-2 md:gap-10">
                  <div className="body-small" style={{ color: "var(--text-tertiary)" }}>{cert.year}</div>
                  <div>
                    <div className="body" style={{ color: "var(--text-primary)" }}>
                      {cert.link ? (
                        <a href={cert.link} target="_blank" rel="noopener noreferrer" className="subtle-link">{cert.title}</a>
                      ) : cert.title}
                    </div>
                    <div className="body-small mt-1" style={{ color: "var(--text-secondary)" }}>{cert.issuer}</div>
                  </div>
                </div>
              ))}
            </div>
          </Slide>
        )}

        {current === 12 && (
          <Slide key="projects">
            <p className="caption mb-12">Projects</p>
            <div>
              {projects.map((project) => {
                const inner = (
                  <div className="grid md:grid-cols-[220px_1fr_auto] gap-2 md:gap-10 items-start">
                    <h3 className="text-base font-medium group-hover:text-[var(--accent)] transition-colors"
                      style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>
                      {project.title}
                    </h3>
                    <div className="body-small" style={{ color: "var(--text-secondary)" }}>{project.description}</div>
                    <div className="flex flex-wrap gap-2 md:justify-end shrink-0">
                      {project.tech.split(", ").slice(0, 3).map((t) => (
                        <span key={t} className="tag whitespace-nowrap">{t}</span>
                      ))}
                    </div>
                  </div>
                );
                return project.link ? (
                  <a key={project.id} href={project.link} target="_blank" rel="noopener noreferrer"
                    className="block group py-8 transition-colors" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    {inner}
                  </a>
                ) : (
                  <div key={project.id} className="block group py-8" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    {inner}
                  </div>
                );
              })}
            </div>
          </Slide>
        )}

        {current === 13 && (
          <Slide key="footer">
            <div className="text-center space-y-6">
              <p className="body" style={{ color: "var(--text-secondary)" }}>
                For further info, questions, or resume, contact{" "}
                <a href={`mailto:${personalInfo.email}`} className="accent-link">{personalInfo.email}</a>
              </p>
              <div className="space-y-2">
                <p className="body-small" style={{ color: "var(--text-tertiary)" }}>2026 Jacob J. Choi</p>
                <p className="body-small" style={{ color: "var(--text-tertiary)" }}>Built with Next.js</p>
              </div>
            </div>
          </Slide>
        )}
      </AnimatePresence>
    </div>
  );
}
