# Jacob J. Choi, Personal Portfolio

> **"Melos contra mundum"**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-pink?style=for-the-badge&logo=framer)](https://www.framer.com/motion/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## Live

**[jacobjchoi.com](https://www.jacobjchoi.com/)**

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
| IV. Competitions & Stage | Entrepreneurship competitions and performance history |
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
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Linting | ESLint 9 with flat config (`eslint.config.mjs`) |
| Styling | Tailwind CSS 3 with CSS custom properties |
| Animations | Framer Motion 12 |
| Icons | react-icons |
| Fonts | Fraunces, JetBrains Mono, Inter, self hosted via `next/font` |
| SEO | Generated `robots.txt`, `sitemap.xml`, and link preview card |
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
npm run verify    # Everything CI runs, chained fail-closed
```

`npm run verify` is the canonical local gate. It chains lint, type check, the
annotated-text compiler tests, real-content validation, the asset provenance lock,
signature reproducibility, the advisory-gate self-tests, the build, and the live
dependency advisory gate. CI invokes these same npm scripts rather than
duplicating the commands, so the shared steps cannot drift apart. CI is not a
strict superset in the other direction either: it additionally runs
`node --check` over the policy engine, which `npm run verify` does not.

Stop the dev server before running a production build. Building while `next dev` is live corrupts the `.next` cache.

---

## Project Structure

```
.github/workflows/ci.yml        # The gate: lint, types, tests, provenance, build, advisories
docs/AUDIT-2026-07.md           # Canonical audit record
docs/adr/                       # Architecture decision records
public/                         # Headshot, favicon
scripts/
├── generate-signature.cjs      # Offline generator for the signature path
├── GreatVibes.ttf              # Font it reads, committed with its OFL licence
├── asset-provenance.json       # Recorded hashes for committed binary assets
├── verify-provenance.mjs       # Asset lock: committed files must match the record
├── audit-check.mjs             # Fail-closed dependency advisory gate
├── audit-check.test.mjs        # Adversarial fixtures for that gate
└── validate-content.ts         # Validates the real annotated site copy
src/
├── app/
│   ├── layout.tsx              # Root layout, metadata, canonical, favicon, Speed Insights
│   ├── page.tsx                # Server component: computes the build year, renders HomeContent
│   ├── HomeContent.tsx         # The page itself, all sections
│   ├── fonts.ts                # next/font declarations, self hosted at build time
│   ├── opengraph-image.tsx     # Link preview card, generated at build time from the design tokens
│   ├── robots.ts               # Generates /robots.txt
│   ├── sitemap.ts              # Generates /sitemap.xml
│   └── globals.css             # Design tokens, component classes, a11y and print
├── assets/
│   ├── Fraunces-Display600.ttf # Static instance for the preview card, committed with its OFL licence
│   └── Fraunces-OFL.txt
├── components/
│   └── Global/
│       └── SignatureMark.tsx   # Self drawing footer signature
├── lib/
│   └── annotated-text.ts       # Compiles bio prose plus annotations into typed segments
└── constants/
    ├── index.ts                # Barrel exports
    ├── socials.ts              # personalInfo, socialLinks, bio prose and its annotations
    ├── experience.ts           # currentExperience, pastExperience, achievementGroups, projects, certifications, awards
    └── signature.ts            # Generated signature path, do not hand edit
```

## Content

Site content lives in `src/constants/`. Edit those files to update the page. The
arrays carry explicit types checked with `satisfies`, so a malformed entry fails
the type check rather than rendering wrong.

The hero bio is prose with **annotations co-located beside it**: the coloured
phrases and inline links are declared next to the text they refer to, not hidden in
a component. Each annotated phrase must appear exactly once, ranges may not
overlap, links must be real `https` URLs, and accents come from a closed
vocabulary. Reword an annotated phrase without updating its annotation and the
build fails naming the phrase, instead of silently dropping the highlight.

## Signature

The footer copyright mark is a cursive signature that draws itself on scroll. `src/constants/signature.ts` is a generated artifact, a single SVG path traced from the Great Vibes font with connectors bridging the word gaps. The browser ships the path string only, no font and no library at runtime. Drawing uses `pathLength="1"` with an animated `stroke-dashoffset`, triggered by an `IntersectionObserver`.

Regenerate with `NODE_PATH=./node_modules node scripts/generate-signature.cjs`. Everything it needs is in the repository: `opentype.js` is a declared dev dependency and the Great Vibes font is committed alongside its OFL licence, so a fresh clone reproduces the committed path byte for byte.

---

## Contact

**Jacob J. Choi**
- **Email**: [jacob77choi@gmail.com](mailto:jacob77choi@gmail.com)
- [LinkedIn](https://www.linkedin.com/in/jacobjchoi/) / [GitHub](https://github.com/jacob7choi-xyz) / [Website](https://www.jacobjchoi.com/)

---

## License

[MIT](LICENSE)
