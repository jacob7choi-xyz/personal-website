# Jacob J. Choi - Personal Portfolio

> **"Melos contra Mundum"** - A fade-show portfolio telling the story of pivots, resilience, and building things that matter.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-pink?style=for-the-badge&logo=framer)](https://www.framer.com/motion/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## Live

**[jacobjchoi.xyz](https://www.jacobjchoi.xyz/)**

---

## About

A full-viewport fade-show presentation -- no scrolling. 15 slides navigate via arrow keys, scroll wheel, or swipe. The site tells a personal journey (Juilliard to coding to clinical AI) before presenting experience, credentials, and projects.

### Design

- **Violet accent** (`#A78BFA`) on near-black (`#050505`)
- **Fade transitions** with blur and scale via Framer Motion `AnimatePresence`
- **Floating gradient orbs** as ambient background
- **Cursor-following aura** with pulsing concentric rings (desktop only)
- **Space Grotesk + Inter** typography pairing

### Navigation

- **Desktop**: Scroll wheel, arrow keys, Home/End, Space, click (top half = back, bottom half = forward)
- **Mobile**: Swipe up/down, tap (top half = back, bottom half = forward)
- **Dot nav (desktop)**: Hover labels, journey dot grouping, highlight on hover
- **Dot nav (mobile)**: Simplified minimal dots

### Accessibility

- `prefers-reduced-motion` disables all animations
- `prefers-contrast: high` support
- Keyboard navigation (arrow keys, Space, Home/End)
- Touch/swipe/tap navigation on mobile
- Semantic HTML with `<main>`, `<nav>` landmarks and `aria-label` attributes
- Focus rings with accent color

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 3 + CSS custom properties |
| Animations | Framer Motion 12 |
| Fonts | Inter, Space Grotesk |
| Deployment | Vercel |

---

## Quick Start

```bash
git clone https://github.com/jacob7choi-xyz/jacob-choi-website.git
cd jacob-choi-website
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build     # Production build
npm run start     # Serve production build
npm run lint      # ESLint
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout, orbs, CursorAura
│   ├── page.tsx            # 15-slide fade-show presentation
│   └── globals.css         # Design system, orb animations, aura keyframes
├── components/
│   └── Global/
│       └── CursorAura.tsx  # Cursor-following aura with pulsing rings
└── constants/
    ├── experience.ts       # currentExperience, pastExperience, projects, certifications
    ├── socials.ts          # personalInfo, socialLinks
    └── index.ts            # Barrel exports
```

## Content

All site content lives in `src/constants/`. Edit those files to update the site -- no component changes needed.

---

## Slide Order

| # | Slide | Content |
|---|-------|---------|
| 0 | Hero | Name, title, email, social icons |
| 1 | Quote | "Melos contra mundum" |
| 2-7 | Journey | Personal narrative (6 slides) |
| 8 | In Detail | Bio + headshot |
| 9 | Current | Current roles |
| 10 | Previously | Past professional experience |
| 11 | Credentials | Certifications |
| 12 | Competitions & Music | Entrepreneurship + music achievements |
| 13 | Projects | Technical projects with tech tags |
| 14 | Footer | Contact + copyright |

---

## Contact

**Jacob J. Choi**
- **Email**: [jacob77choi@gmail.com](mailto:jacob77choi@gmail.com)
- [LinkedIn](https://www.linkedin.com/in/jacobjchoi/) / [GitHub](https://github.com/jacob7choi-xyz) / [Website](https://www.jacobjchoi.xyz/)

---

## License

[MIT](LICENSE)
