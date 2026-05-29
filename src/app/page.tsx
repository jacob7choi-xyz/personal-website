"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { FaGithub, FaLinkedinIn, FaXTwitter, FaInstagram, FaYoutube } from "react-icons/fa6";

import {
  currentExperience,
  pastExperience,
  projects,
  certifications,
  awards,
  socialLinks,
  personalInfo,
} from "@/constants";

const SOCIALS: Record<string, { icon: React.ReactNode; color: string }> = {
  GitHub: { icon: <FaGithub />, color: "#F0F0F0" },
  LinkedIn: { icon: <FaLinkedinIn />, color: "#3B9CE0" },
  X: { icon: <FaXTwitter />, color: "#F0F0F0" },
  Instagram: { icon: <FaInstagram />, color: "#E4405F" },
  YouTube: { icon: <FaYoutube />, color: "#FF3D3D" },
};

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

const rule = "1px solid var(--rule-soft)";

/* ------------------------------------------------------------------ */
/* The waveform that bridges the two voices. Deterministic (no random, */
/* no Date) so server and client render identically — drawn once on    */
/* load like a single bow stroke, then still.                          */
/* ------------------------------------------------------------------ */
const WAVE_PATH = (() => {
  const W = 1000;
  const mid = 35;
  const N = 64;
  const pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = t * W;
    const env = Math.sin(Math.PI * t); // fades to flat at both ends
    const a =
      Math.sin(t * 21) * 0.55 +
      Math.sin(t * 8.5 + 1.3) * 0.32 +
      Math.sin(t * 38 + 0.7) * 0.14;
    const y = mid - a * env * (mid - 5);
    pts.push([x, y]);
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const xc = ((x0 + x1) / 2).toFixed(1);
    const yc = ((y0 + y1) / 2).toFixed(1);
    d += ` Q ${x0.toFixed(1)} ${y0.toFixed(1)} ${xc} ${yc}`;
  }
  return d;
})();

function emphasize(text: string, map: Record<string, string>) {
  return Object.entries(map).reduce(
    (acc, [phrase, color]) =>
      acc.replace(phrase, `<span style="color:${color}">${phrase}</span>`),
    text
  );
}

type Link = { text: string; url: string };

function linkify(text: string, links?: Link[]) {
  if (!links) return text;
  return links.reduce(
    (acc, l) =>
      acc.replace(
        l.text,
        `<a class="ink-link" href="${l.url}" target="_blank" rel="noopener noreferrer">${l.text}</a>`
      ),
    text
  );
}

function Waveform() {
  const reduce = useReducedMotion();
  return (
    <svg
      viewBox="0 0 1000 70"
      preserveAspectRatio="none"
      className="w-full h-10 md:h-14"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="voice" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FF9E8A" />
          <stop offset="34%" stopColor="#54E09C" />
          <stop offset="64%" stopColor="#2FD2CE" />
          <stop offset="100%" stopColor="#36ADEE" />
        </linearGradient>
      </defs>
      <motion.path
        d={WAVE_PATH}
        fill="none"
        stroke="url(#voice)"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={reduce ? false : { pathLength: 0, opacity: 0 }}
        animate={reduce ? undefined : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.8, ease: "easeInOut", delay: 0.4 }}
      />
    </svg>
  );
}

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function Marker({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-4 mb-7">
      <span className="serif italic text-2xl" style={{ color: "var(--violet)" }}>
        {num}
      </span>
      <span className="eyebrow">{label}</span>
      <span className="h-px flex-1" style={{ background: "var(--rule)" }} />
    </div>
  );
}

function Section({
  num,
  label,
  children,
}: {
  num: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={label} className="mt-20 md:mt-24">
      <Reveal>
        <Marker num={num} label={label} />
      </Reveal>
      <Reveal delay={0.05}>{children}</Reveal>
    </section>
  );
}

function ExternalOrText({
  link,
  children,
  variant = "meta",
}: {
  link?: string;
  children: React.ReactNode;
  variant?: "meta" | "ink";
}) {
  if (!link) return <>{children}</>;
  return (
    <a
      className={variant === "ink" ? "ink-link" : "meta-link"}
      href={link}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

export default function Home() {
  const year = new Date().getFullYear();
  const reduce = useReducedMotion();
  const simplePast = pastExperience.filter((e) => !e.items);
  const groupedPast = pastExperience.filter((e) => e.items);

  return (
    <main className="mx-auto max-w-3xl px-6 md:px-8 py-16 md:py-24">
      {/* ---------------------------------------------------------- Hero */}
      <header>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <div
            className="mb-9 inline-block rounded-2xl p-[2px]"
            style={{
              background: "linear-gradient(140deg, #FF9E8A, #54E09C 45%, #36ADEE)",
              boxShadow: "0 10px 44px rgba(60, 180, 140, 0.28)",
            }}
          >
            <Image
              src="/Jacob_Choi_Headshot.JPG"
              alt="Jacob J. Choi"
              width={2305}
              height={1537}
              priority
              className="rounded-[14px] block h-auto w-[210px] md:w-[240px]"
            />
          </div>

          <h1
            className="serif name-gradient font-medium text-6xl md:text-8xl leading-[0.95]"
            style={{ letterSpacing: "-0.02em" }}
          >
            Jacob J. Choi
          </h1>

          <p className="serif text-xl md:text-2xl mt-5">
            <span style={{ color: "var(--violet)" }}>Musician</span>
            <span className="mono text-base mx-3" style={{ color: "var(--text-tertiary)" }}>
              ×
            </span>
            <span style={{ color: "var(--cyan)" }}>AI Engineer</span>
          </p>

          <p
            className="serif italic text-lg mt-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {personalInfo.status}
          </p>
        </motion.div>

        <motion.div
          className="mt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Waveform />
        </motion.div>

        <motion.div
          className="mt-10 max-w-2xl space-y-5"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <p
            className="text-[1.1rem] leading-[1.75]"
            style={{ color: "var(--text-primary)" }}
            dangerouslySetInnerHTML={{
              __html: emphasize(
                linkify(personalInfo.bio.intro, personalInfo.bio.introLinks),
                {
                  "biomedical GraphRAG": "var(--cyan)",
                  "three-year grant from the Duke Endowment": "var(--violet-soft)",
                }
              ),
            }}
          />
          <p
            className="text-[1.02rem] leading-[1.8]"
            style={{ color: "var(--text-secondary)" }}
            dangerouslySetInnerHTML={{
              __html: linkify(personalInfo.bio.focus, personalInfo.bio.focusLinks),
            }}
          />
        </motion.div>
      </header>

      {/* ----------------------------------------------------------- Now */}
      <Section num={ROMAN[0]} label="Now">
        <ul>
          {currentExperience.map((e) => (
            <li
              key={e.id}
              className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-x-6 gap-y-1 py-3.5"
              style={{ borderBottom: rule }}
            >
              <span className="serif text-lg">{e.title}</span>
              <span
                className="mono text-[0.8rem] sm:text-right"
                style={{ color: "var(--text-secondary)" }}
              >
                <ExternalOrText link={e.link}>{e.company}</ExternalOrText>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {/* ------------------------------------------------- Selected Work */}
      <Section num={ROMAN[1]} label="Selected Work">
        <div>
          {projects.map((p) => (
            <a
              key={p.id}
              href={p.link}
              target="_blank"
              rel="noopener noreferrer"
              className="project-row block py-5 focus-ring"
              style={{ borderBottom: rule }}
            >
              <h3 className="serif text-xl proj-title">
                {p.title}
                <span className="proj-arrow inline-block ml-1.5" style={{ color: "var(--cyan)" }}>
                  ↗
                </span>
              </h3>
              <p
                className="text-[0.97rem] leading-relaxed mt-1.5 max-w-2xl"
                style={{ color: "var(--text-secondary)" }}
              >
                {p.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {p.tech.split(", ").map((t) => (
                  <span key={t} className="pill">
                    {t}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------- Path */}
      <Section num={ROMAN[2]} label="Past">
        <ul>
          {simplePast.map((e) => (
            <li
              key={e.id}
              className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-x-6 gap-y-1 py-3.5"
              style={{ borderBottom: rule }}
            >
              <span className="sm:flex-1">
                <span className="serif text-lg">
                  <ExternalOrText link={e.link} variant="ink">
                    {e.title}
                  </ExternalOrText>
                </span>
                {e.mentorText && (
                  <span
                    className="block mono text-xs mt-0.5"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <ExternalOrText link={e.mentorLink}>{e.mentorText}</ExternalOrText>
                  </span>
                )}
              </span>
              <span
                className="mono text-[0.8rem] sm:text-right"
                style={{ color: "var(--text-secondary)" }}
              >
                {e.company}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {/* ------------------------------------------------ Music & Stage */}
      <Section num={ROMAN[3]} label="Music & Stage">
        <div>
          {groupedPast.map((group) => (
            <div key={group.id} className="py-3.5" style={{ borderBottom: rule }}>
              <h3 className="serif text-lg mb-2">{group.title}</h3>
              <ul className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mono text-[0.8rem]">
                {group.items!.map((it, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span style={{ color: "var(--text-secondary)" }}>
                      <ExternalOrText link={it.link}>{it.text}</ExternalOrText>
                    </span>
                    {idx < group.items!.length - 1 && (
                      <span style={{ color: "var(--text-tertiary)" }}>·</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* --------------------------------------------------- Credentials */}
      <Section num={ROMAN[4]} label="Honors & Credentials">
        <ul>
          {certifications.map((c) => (
            <li
              key={c.id}
              className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-x-6 gap-y-1 py-3.5"
              style={{ borderBottom: rule }}
            >
              <span className="serif text-base">
                <ExternalOrText link={c.link} variant="ink">
                  {c.title}
                </ExternalOrText>
              </span>
              <span
                className="mono text-[0.8rem] sm:text-right"
                style={{ color: "var(--text-secondary)" }}
              >
                {c.issuer} · {c.year}
              </span>
            </li>
          ))}
          {awards.map((a) => (
            <li
              key={`award-${a.id}`}
              className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-x-6 gap-y-1 py-3.5"
              style={{ borderBottom: rule }}
            >
              <span className="serif text-base">
                <ExternalOrText link={a.link} variant="ink">
                  {a.title}
                </ExternalOrText>
              </span>
              <span
                className="mono text-[0.8rem] sm:text-right"
                style={{ color: "var(--text-secondary)" }}
              >
                <ExternalOrText link={a.issuerLink}>{a.issuer}</ExternalOrText> · {a.year}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {/* ------------------------------------------------------- Contact */}
      <Section num={ROMAN[5]} label="Contact">
        <p
          className="text-[1.05rem] leading-[1.8] max-w-xl"
          style={{ color: "var(--text-secondary)" }}
        >
          Open to conversations about AI engineering, research-to-production, and
          good music.
        </p>
        <a
          href={`mailto:${personalInfo.email}`}
          className="serif name-gradient inline-block text-2xl md:text-3xl mt-4 focus-ring"
        >
          {personalInfo.email}
        </a>
        <div className="flex items-center gap-6 mt-8 text-2xl">
          {socialLinks.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.name}
              className="social-ico focus-ring"
              style={{ color: SOCIALS[s.name]?.color }}
            >
              {SOCIALS[s.name]?.icon}
            </a>
          ))}
        </div>
      </Section>

      {/* -------------------------------------------------------- Footer */}
      <footer
        className="mt-24 pt-8 flex flex-col sm:flex-row justify-between gap-2 mono text-xs"
        style={{ borderTop: "1px solid var(--rule)", color: "var(--text-tertiary)" }}
      >
        <span>© {year} Jacob J. Choi</span>
        <span>Built with Next.js &amp; Framer Motion</span>
      </footer>
    </main>
  );
}
