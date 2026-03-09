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

const TOTAL_SLIDES = 15;

const SLIDE_LABELS = [
  "Home", "Quote", null, null, null, null, null, null,
  "In Detail", "Current", "Previously", "Credentials", "Competitions & Music", "Projects", "Contact",
];

const JOURNEY_RANGE = [2, 3, 4, 5, 6, 7];

function Slide({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={fadeVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.9, ease }}
      className="slide-container"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2.5rem 1.25rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "56rem", margin: "0 auto", flexShrink: 0 }}>
        {children}
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [current, setCurrent] = useState(0);
  const lockRef = useRef(false);
  const touchStartRef = useRef<{ y: number; id: number } | null>(null);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelAccum = useRef(0);

  const LOCK_MS = 1000;

  const lock = useCallback(() => {
    lockRef.current = true;
    setTimeout(() => { lockRef.current = false; }, LOCK_MS);
  }, []);

  const go = useCallback((direction: 1 | -1) => {
    if (lockRef.current) return;
    setCurrent((prev) => {
      const next = prev + direction;
      if (next < 0 || next >= TOTAL_SLIDES) return prev;
      lock();
      return next;
    });
  }, [lock]);

  const goTo = useCallback((index: number) => {
    if (lockRef.current || index < 0 || index >= TOTAL_SLIDES) return;
    setCurrent((prev) => {
      if (index === prev) return prev;
      lock();
      return index;
    });
  }, [lock]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (lockRef.current) return;

      // Accumulate wheel delta and debounce to handle trackpad momentum
      wheelAccum.current += e.deltaY;
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
      wheelTimer.current = setTimeout(() => { wheelAccum.current = 0; }, 200);

      if (Math.abs(wheelAccum.current) < 30) return;
      const direction = wheelAccum.current > 0 ? 1 : -1;
      wheelAccum.current = 0;
      go(direction as 1 | -1);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) return; // Ignore multi-touch
      touchStartRef.current = { y: e.touches[0].clientY, id: e.touches[0].identifier };
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      // Find the matching touch by identifier
      const touch = Array.from(e.changedTouches).find(
        (t) => t.identifier === touchStartRef.current?.id
      );
      if (!touch) return;
      const delta = touchStartRef.current.y - touch.clientY;
      touchStartRef.current = null;

      // Skip tap-to-advance if user tapped a button or link
      const target = e.target as HTMLElement;
      const isInteractive = target.closest("a, button");

      if (Math.abs(delta) < 10) {
        if (!isInteractive) {
          // Tap top half to go back, bottom half to go forward
          go(touch.clientY < window.innerHeight / 2 ? -1 : 1);
        }
        return;
      }
      if (Math.abs(delta) < 50) return;
      go(delta > 0 ? 1 : -1);
    };

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInteractive = tag === "A" || tag === "BUTTON" || tag === "INPUT" || tag === "TEXTAREA";
      if (e.key === "ArrowDown") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); go(-1); }
      else if (e.key === "Home") { e.preventDefault(); goTo(0); }
      else if (e.key === "End") { e.preventDefault(); goTo(TOTAL_SLIDES - 1); }
      else if (e.key === " " && !isInteractive) { e.preventDefault(); go(1); }
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, nav")) return;
      go(e.clientY < window.innerHeight / 2 ? -1 : 1);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
    };
  }, [go, goTo]);

  return (
    <main aria-label="Portfolio presentation" style={{ background: "var(--bg-primary)", height: "100dvh", overflow: "hidden" }}>

      {/* Dot indicators */}
      <nav aria-label="Slide navigation" className="hidden md:flex" style={{
        position: "fixed", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
        zIndex: 10, flexDirection: "column", gap: "8px", alignItems: "flex-end",
      }}>
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => {
          const isJourney = JOURNEY_RANGE.includes(i);
          const isFirstJourney = i === JOURNEY_RANGE[0];
          const isLastJourney = i === JOURNEY_RANGE[JOURNEY_RANGE.length - 1];

          // Skip journey dots except render them inside the group
          if (isJourney && !isFirstJourney) return null;

          if (isFirstJourney) {
            return (
              <div key="journey-group" className="dot-group" style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 8,
              }}>
                <span className="dot-label" style={{
                  position: "absolute",
                  right: 24,
                  top: "50%",
                  transform: "translateY(-50%) translateX(4px)",
                  whiteSpace: "nowrap",
                  fontSize: 13,
                  fontFamily: "'Inter', sans-serif",
                  color: "var(--text-secondary)",
                  opacity: 0,
                  transition: "opacity 0.2s, transform 0.2s",
                  pointerEvents: "none",
                }}>
                  Journey
                </span>
                {JOURNEY_RANGE.map((j) => (
                  <button
                    key={j}
                    onClick={() => goTo(j)}
                    aria-label={`Go to Journey slide ${j - 1}`}
                    aria-current={j === current ? "true" : undefined}
                    style={{
                      width: "auto", height: 20, display: "flex", alignItems: "center",
                      background: "transparent",
                      border: "none", cursor: "pointer", padding: 0,
                    }}
                  >
                    <span className="dot-indicator" style={{
                      width: 7,
                      height: j === current ? 22 : 7,
                      borderRadius: 3,
                      background: j === current ? "var(--accent)" : "var(--text-tertiary)",
                      transition: "all 0.3s ease",
                      opacity: j === current ? 1 : 0.5,
                      display: "block",
                    }} />
                  </button>
                ))}
              </div>
            );
          }

          return (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to ${SLIDE_LABELS[i]}`}
              aria-current={i === current ? "true" : undefined}
              className="dot-btn"
              style={{
                position: "relative",
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                paddingLeft: 8,
              }}
            >
              <span className="dot-label" style={{
                position: "absolute",
                right: 16,
                whiteSpace: "nowrap",
                fontSize: 13,
                fontFamily: "'Inter', sans-serif",
                color: "var(--text-secondary)",
                opacity: 0,
                transform: "translateX(4px)",
                transition: "opacity 0.2s, transform 0.2s",
                pointerEvents: "none",
              }}>
                {SLIDE_LABELS[i]}
              </span>
              <span className="dot-indicator" style={{
                width: 7,
                height: i === current ? 22 : 7,
                borderRadius: 3,
                background: i === current ? "var(--accent)" : "var(--text-tertiary)",
                transition: "all 0.3s ease",
                opacity: i === current ? 1 : 0.5,
                display: "block",
              }} />
            </button>
          );
        })}
      </nav>

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
                    aria-label={social.name}
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
              className="text-xl md:text-2xl lg:text-3xl font-light leading-relaxed tracking-tight text-center"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-secondary)" }}
            >
              Now I&apos;m building a production agentic system and biomedical GraphRAG corpus for rural patients in Maine and North Carolina, helping clinicians identify the right cancer treatment for each patient. Sponsored by the Duke Endowment.
            </p>
          </Slide>
        )}

        {current === 8 && (
          <Slide key="about">
            <p className="caption mb-4 md:mb-12">In Detail</p>
            <div className="grid lg:grid-cols-2 gap-4 md:gap-16 items-center">
              <div className="flex justify-center lg:justify-end order-1 lg:order-2">
                <div className="headshot-wrapper relative w-72 md:w-80 lg:w-full max-w-md">
                  <div className="headshot-glow" />
                  <Image src="/Jacob_Choi_Headshot.JPG" alt="Jacob Choi" width={500} height={500} className="rounded-2xl w-full relative z-10" />
                </div>
              </div>
              <div className="text-base md:text-lg leading-relaxed space-y-3 md:space-y-6 order-2 lg:order-1" style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
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
            </div>
          </Slide>
        )}

        {current === 9 && (
          <Slide key="exp-now">
            <p className="caption mb-4">Experience</p>
            <h2 className="heading-3 mb-12">Current</h2>
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
            <h2 className="heading-3 mb-12">Previously</h2>
            <div className="space-y-10">
              {pastExperience.filter((exp) => !exp.items).map((exp) => (
                <div key={exp.id} className="grid md:grid-cols-[220px_1fr] gap-2 md:gap-10">
                  <div className="body-small" style={{ color: "var(--text-tertiary)" }}>
                    {exp.link ? (
                      <a href={exp.link} target="_blank" rel="noopener noreferrer" className="subtle-link">{exp.title}</a>
                    ) : exp.title}
                  </div>
                  <div>
                    <div className="body" style={{ color: "var(--text-primary)" }}>{exp.company}</div>
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

        {current === 12 && (
          <Slide key="exp-extras">
            <p className="caption mb-4">Experience</p>
            <h2 className="heading-3 mb-12">Competitions & Music</h2>
            <div className="space-y-10">
              {pastExperience.filter((exp) => exp.items).map((exp) => (
                <div key={exp.id} className="grid md:grid-cols-[220px_1fr] gap-2 md:gap-10">
                  <div className="body-small" style={{ color: "var(--text-tertiary)" }}>{exp.title}</div>
                  <div className="body" style={{ color: "var(--text-primary)" }}>
                    <ul className="space-y-1">
                      {exp.items!.map((item, j) => (
                        <li key={j}>
                          {item.link ? (
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="subtle-link">{item.text}</a>
                          ) : item.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </Slide>
        )}

        {current === 11 && (
          <Slide key="creds">
            <p className="caption mb-4">Experience</p>
            <h2 className="heading-3 mb-12">Credentials</h2>
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

        {current === 13 && (
          <Slide key="projects">
            <p className="caption mb-6 md:mb-12">Projects</p>
            <div>
              {projects.map((project) => (
                <div key={project.id} className="py-5 md:py-8" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <div className="grid md:grid-cols-[220px_1fr_auto] gap-2 md:gap-10 items-start">
                    <h3 className="text-base font-medium transition-colors"
                      style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>
                      {project.link ? (
                        <a href={project.link} target="_blank" rel="noopener noreferrer" className="subtle-link hover:text-[var(--accent)]">{project.title}</a>
                      ) : project.title}
                    </h3>
                    <div className="body-small" style={{ color: "var(--text-secondary)" }}>{project.description}</div>
                    <div className="flex flex-wrap gap-2 md:justify-end shrink-0">
                      {project.tech.split(", ").slice(0, 3).map((t) => (
                        <span key={t} className="tag whitespace-nowrap">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Slide>
        )}

        {current === 14 && (
          <Slide key="footer">
            <div className="text-center space-y-6">
              <p className="body" style={{ color: "var(--text-secondary)" }}>
                For further info, questions, or resume, contact{" "}
                <a href={`mailto:${personalInfo.email}`} className="accent-link">{personalInfo.email}</a>
              </p>
              <div className="space-y-2">
                <p className="body-small" style={{ color: "var(--text-tertiary)" }}>{new Date().getFullYear()} Jacob J. Choi</p>
                <p className="body-small" style={{ color: "var(--text-tertiary)" }}>Built with Next.js</p>
              </div>
            </div>
          </Slide>
        )}
      </AnimatePresence>
    </main>
  );
}
