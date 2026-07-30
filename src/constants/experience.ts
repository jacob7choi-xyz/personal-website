/* Types are explicit on purpose. This is developer-authored content, so a
   malformed entry should fail `tsc` rather than degrade silently at render
   time. `satisfies` keeps the literal inference while enforcing the shape. */

/* An https PREFIX constraint, not URL validation. It rejects `http://` and
   accidental non-URLs, which is the failure mode that actually occurs in
   developer-authored constants. It will happily accept a malformed URL that
   starts with https://. Sufficient here because these values are authored in
   this file, JSX escapes them, and reachability is checked separately. Do not
   describe it as validating URLs. */
type HttpsUrl = `https://${string}`;

type LinkedItem = {
  text: string;
  link: HttpsUrl;
};

/* At least one element, so `items: []` is a compile error instead of an empty
   rendered group. */
type NonEmpty<T> = readonly [T, ...T[]];

type CurrentRole = {
  id: number;
  title: string;
  company: string;
  link?: HttpsUrl;
};

type PastRole = {
  id: number;
  title: string;
  company: string;
  link?: HttpsUrl;
  mentorText?: string;
  mentorLink?: HttpsUrl;
};

/* Titled clusters of linked achievements. Deliberately a SEPARATE array from
   pastExperience rather than an optional `items` field on it. The two render as
   different sections, so keeping one heterogeneous array whose semantic type had
   to be recovered from a nullable field was accidental complexity, and it made
   misclassification and empty groups representable. */
type AchievementGroup = {
  id: number;
  title: string;
  items: NonEmpty<LinkedItem>;
};

type Project = {
  id: number;
  title: string;
  description: string;
  /* Comma separated, split on ", " at render time. A tech name containing a
     comma would split wrongly. */
  tech: string;
  link: HttpsUrl;
};

type Certification = {
  id: number;
  title: string;
  issuer: string;
  year: string;
  link: HttpsUrl;
};

type Award = {
  id: number;
  title: string;
  issuer: string;
  issuerLink?: HttpsUrl;
  link: HttpsUrl;
  year: string;
};

export const currentExperience = [
  {
    id: 1,
    title: "AI/Agentic Pipeline Engineer",
    company: "Maine Cancer Genomics Initiative @ The Jackson Laboratory",
    link: "https://www.jax.org/clinical-genomics/maine-cancer-genomics-initiative",
  },
  {
    id: 2,
    title: "B.A. Computer Science: AI",
    company: "Colby College, 3.86 GPA",
  },
] satisfies readonly CurrentRole[];

export const pastExperience = [
  {
    id: 1,
    title: "Studied Abroad",
    company: "University of Sydney, Spring 2025",
  },
  {
    id: 2,
    title: "Turing Test Simulation",
    company: "Independent Study, Colby College",
    link: "https://drive.google.com/file/d/1F9lYxAleIydY2zrBPGXKbcYojcdidbvQ/view?usp=sharing",
    mentorLink: "https://www.microsoft.com/en-us/research/people/markenc/",
    mentorText: "Mentored by Mark Encarnación, Microsoft Research",
  },
  {
    id: 3,
    title: "AI/ML Research Intern",
    company: "USC Institute for Creative Technologies (Los Angeles, CA)",
  },
  {
    id: 4,
    title: "Legal Intern",
    company: "Shin & Kim Law Firm (Seoul, Korea)",
  },
  {
    id: 5,
    title: "Investment Analyst Intern",
    company: "Colby College Office of Investments (Boston, MA)",
  },
] satisfies readonly PastRole[];

export const achievementGroups = [
  {
    id: 1,
    title: "Entrepreneurship Competitions",
    items: [
      { text: "Semi-Finalist Greenlight Maine", link: "https://greenlightmaine.com/entrepreneurs/" },
      {
        text: "1st Place Colby BOTN",
        link: "https://www.colby.edu/halloran-lab-for-entrepreneurship/news/back-of-the-napkin-challenge/",
      },
    ],
  },
  {
    id: 2,
    title: "Musician & Performer",
    items: [
      {
        text: "Juilliard Admission (Viola, BM)",
        link: "https://drive.google.com/file/d/1FO3V951a3Df_s3PNQpcFhH5j5kqQgFGR/view?usp=sharing",
      },
      { text: "NPR \"From The Top\"", link: "https://fromthetop.org/musician/jacob-choi/" },
      {
        text: "DSO Lynn Harrell Concerto Competition Finalist",
        link: "https://theviolinchannel.com/winners-announced-for-dallas-symphonys-lynn-harrell-concerto-competition/",
      },
    ],
  },
] satisfies readonly AchievementGroup[];

export const projects = [
  {
    id: 1,
    title: "HarmonyRestorer",
    description:
      "AI-powered audio restoration platform with a custom-trained OpGAN benchmarked on 146K noisy/clean pairs (SDR 23.7 dB, PESQ 4.04)",
    tech: "React, FastAPI, PyTorch",
    link: "https://github.com/jacob7choi-xyz/harmonyrestorer-v1",
  },
  {
    id: 2,
    title: "Polymarket Research",
    description:
      "Arbitrage detection and calibration research across 9,900+ prediction markets with production-grade resilience and observability",
    tech: "Python, httpx, Pydantic, Prometheus, Docker, SQLite",
    link: "https://github.com/jacob7choi-xyz/polymarket-research",
  },
  {
    id: 3,
    title: "Credential Vault",
    description:
      "On-chain identity system with guardian recovery, key rotation history, and consent-gated credential verification",
    tech: "Next.js, Solidity, Hardhat",
    link: "https://github.com/jacob7choi-xyz/credential-vault",
  },
  {
    id: 4,
    title: "TuneTales",
    description:
      "AI-powered music storytelling platform that turns artist histories into immersive, narrative-driven experiences",
    tech: "Next.js, Python, TypeScript",
    link: "https://github.com/jacob7choi-xyz/tunetales-v1",
  },
] satisfies readonly Project[];

export const certifications = [
  {
    id: 1,
    title: "RAG and Agentic AI",
    issuer: "IBM",
    year: "2025",
    link: "https://drive.google.com/file/d/1naI3W5svxoC_ZbuVDplOpHQliA4EybSh/view?usp=sharing",
  },
  {
    id: 2,
    title: "HBS CORe (Credential of Readiness)",
    issuer: "Harvard Business School",
    year: "2024",
    link: "https://drive.google.com/file/d/1pSY99sQz0IrGP_O81GCHUhzw3T0M_lUj/view?usp=sharing",
  },
  {
    id: 3,
    title: "Tuck Business Bridge Program",
    issuer: "Tuck School of Business, Dartmouth",
    year: "2024",
    link: "https://drive.google.com/file/d/1VqSwrusijo-3-OB5XgDPo4pF-swwPaeq/view?usp=sharing",
  },
] satisfies readonly Certification[];

export const awards = [
  {
    id: 1,
    title: "Korean Ancestry Grant",
    issuer: "William Orr Dingwall Foundation",
    issuerLink: "https://dingwallfoundation.org/",
    link: "https://drive.google.com/file/d/1vVUZGjFkhmm8czIiwXRD8SXOdXfD_vGZ/view?usp=sharing",
    year: "2023, 2024",
  },
  {
    id: 2,
    title: "Safe Cycling Scholarship",
    issuer: "Felix Gonzalez Law Firm",
    issuerLink: "https://felixgonzalezlaw.com/",
    year: "2023",
    link: "https://felixgonzalezlaw.com/safe-cycling-scholarship-winners/",
  },
  {
    id: 3,
    title: "Jack Kent Cooke Young Artist Award",
    issuer: "NPR's From The Top",
    issuerLink: "https://fromthetop.org/",
    link: "https://fromthetop.org/meet-the-class-of-2022/",
    year: "2022",
  },
] satisfies readonly Award[];
