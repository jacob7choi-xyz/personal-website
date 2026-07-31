# Jacob J. Choi, Personal Portfolio

> **"Melos contra mundum"**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-pink?style=for-the-badge&logo=framer)](https://www.framer.com/motion/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## Live

**[jacobjchoi.xyz](https://www.jacobjchoi.xyz/)**

---

## About

A single scrolling page, editorial and content first, built around one idea: musician and AI engineer as the same person. Admitted to Juilliard for viola, now building biomedical GraphRAG and agentic pipelines at The Jackson Laboratory.

Six numbered sections after the hero. No slideshow, no dashboard, no filler.

### Design

- **Near black background** (`#0a0a0c`) with a faint iridescent vignette
- **Iridescent accent sweep**, coral to green to teal to blue (`#FF9E8A`, `#54E09C`, `#2FD2CE`, `#36ADEE`), used for the name, the waveform, and the signature
- **Two accent tokens** map to the two identities: green `#45DD9E` for the musician, teal `#36C5E6` for the engineer
- **Warm off white text** (`#ECE8E1`) on a warm gray body (`#9A958C`)
- **Three voices in the type**: Fraunces serif for the expressive lines, JetBrains Mono for labels and metadata, Inter for connective body text
- **An audio waveform** as the connective motif, a deterministic sum of sines drawn once on load
- **A self drawing cursive signature** as the footer copyright mark

Design tokens are CSS custom properties in `src/app/globals.css`. Tailwind handles layout, not color.

### Page structure

| Section | Content |
|---------|---------|
| Hero | Headshot, name, motto, waveform, lead paragraphs |
| I. Now | Current role and degree |
| II. Selected Work | Projects with descriptions and tech tags |
| III. Past | Prior professional and research experience |
| IV. Music & Stage | Performance and competition history |
| V. Honors & Credentials | Certifications and awards |
| VI. Contact | Email and social links |

### Accessibility

- `prefers-reduced-motion` honored in CSS and guarded in every animated component
- `prefers-contrast: high` boosts the text tokens
- Print styles strip backgrounds and force black text, including the gradient name
- Semantic landmarks, a real `h1` to `h3` hierarchy, `aria-label` on every section
- Visible focus rings on all interactive elements
- Icons and arrows are inline SVG, never glyph characters

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 3 with CSS custom properties |
| Animations | Framer Motion 12 |
| Icons | react-icons |
| Fonts | Fraunces, JetBrains Mono, Inter |
| Telemetry | Vercel Speed Insights |
| Deployment | Vercel |

---

## Quick Start

```bash
git clone https://github.com/jacob7choi-xyz/personal-website.git
cd personal-website
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build     # Production build
npm run start     # Serve production build
npm run lint      # ESLint
```

Stop the dev server before running a production build. Building while `next dev` is live corrupts the `.next` cache.

---

## Project Structure

```
.github/workflows/ci.yml        # Lint, type check, build, audit
docs/adr/                       # Architecture decision records
public/                         # Headshot, favicon
scripts/
└── generate-signature.cjs      # Offline generator for the signature path
src/
├── app/
│   ├── layout.tsx              # Root layout, metadata, favicon, Speed Insights
│   ├── page.tsx                # The page, all sections
│   └── globals.css             # Design tokens, fonts, component classes, a11y and print
├── components/
│   └── Global/
│       └── SignatureMark.tsx   # Self drawing footer signature
└── constants/
    ├── index.ts                # Barrel exports
    ├── socials.ts              # personalInfo, socialLinks
    ├── experience.ts           # currentExperience, pastExperience, projects, certifications, awards
    └── signature.ts            # Generated signature path, do not hand edit
```

## Content

Site content lives in `src/constants/`. Edit those files to update the page. Optional fields drive conditional rendering, so an entry without a `link` or without nested `items` simply renders less.

One exception worth knowing: the highlighted phrases in the hero bio are matched by substring in `page.tsx`, so rewording `bio.intro` means updating that map too.

## Signature

The footer copyright mark is a cursive signature that draws itself on scroll. `src/constants/signature.ts` is a generated artifact, a single SVG path traced from the Great Vibes font with connectors bridging the word gaps. The browser ships the path string only, no font and no library at runtime. Drawing uses `pathLength="1"` with an animated `stroke-dashoffset`, triggered by an `IntersectionObserver`.

Regenerate with `NODE_PATH=./node_modules node scripts/generate-signature.cjs`. Everything it needs is in the repository: `opentype.js` is a declared dev dependency and the Great Vibes font is committed alongside its OFL licence, so a fresh clone reproduces the committed path byte for byte.

---

## Contact

**Jacob J. Choi**
- **Email**: [jacob77choi@gmail.com](mailto:jacob77choi@gmail.com)
- [LinkedIn](https://www.linkedin.com/in/jacobjchoi/) / [GitHub](https://github.com/jacob7choi-xyz) / [Website](https://www.jacobjchoi.xyz/)

---

## License

[MIT](LICENSE)
