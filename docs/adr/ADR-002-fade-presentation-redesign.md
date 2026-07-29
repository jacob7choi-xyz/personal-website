# ADR-002: Fade Presentation Redesign

**Status:** Superseded (May 2026) by the editorial single-page redesign now in production
**Date:** 2026-03-09
**Author:** Jacob J. Choi

> Historical record. The fade-show described here was retired in May 2026 and is archived on the `slideshow` branch. The current site is a single scrolling page. See `README.md` for what ships today.

---

## Context

ADR-001's card-based layout was replaced with a clean Apple/Spotify-inspired design (violet accent, true black bg, scroll-triggered animations). That design felt flat and generic -- not world-class. Needed more sophistication, atmosphere, and intentionality.

## Decision

Complete rearchitecture from a scrolling page to a **full-viewport fade-show presentation** with atmospheric background effects.

### Architecture

- **No scrolling on desktop.** Page is locked to `100dvh`, `overflow: hidden`. Mobile slides allow overflow scroll for content-heavy slides.
- **Slide-based navigation.** Each section is a fixed-position full-viewport slide. Wheel, touch, tap, click, and arrow key events trigger transitions between slides.
- **AnimatePresence mode="wait"** cross-fades between slides (0.9s duration, 1s lock between transitions).
- **Fade + blur + scale** transitions: content dissolves from `blur(14px) + scale(0.98) + opacity(0)` into focus.
- **Dot indicators** on the right edge with hover labels and grouped journey dots.

### 15 Slides (in order)

| # | Slide | Content |
|---|-------|---------|
| 0 | Hero | Name, title, email, social icons (brand-colored) |
| 1 | Quote | "Melos contra mundum" -- full viewport, centered |
| 2 | Journey 1 | "A little bit about me..." |
| 3 | Journey 2 | Juilliard / Colby pivot |
| 4 | Journey 3 | Econ, Spanish, finance, law |
| 5 | Journey 4 | "None of it felt right." |
| 6 | Journey 5 | "Then I tried coding." |
| 7 | Journey 6 | Current MCGI/Duke Endowment work |
| 8 | In Detail | Bio text + headshot (side-by-side on desktop, stacked on mobile) |
| 9 | Experience: Current | Two-column table layout |
| 10 | Experience: Previously | Professional roles with locations |
| 11 | Credentials | Certifications (IBM, HBS, Tuck) |
| 12 | Competitions & Music | Entrepreneurship competitions + music achievements |
| 13 | Projects | Row-based list with tech tags, title-only links |
| 14 | Footer | Contact info, copyright (dynamic year), "Built with Next.js" |

### Navigation

- **Desktop:** Wheel (debounced with accumulation for trackpad), arrow keys, Home/End, Space (non-interactive targets only), click (top half = back, bottom half = forward)
- **Mobile:** Swipe up/down (50px threshold), tap (top half = back, bottom half = forward, skips interactive elements)
- **Dot indicators (desktop):** Fixed right side, clickable to jump to any slide, hover labels show slide titles, journey dots grouped with shared label and pill background, dots highlight on hover
- **Dot indicators (mobile):** Simplified minimal dots (no labels, no grouping, no hover effects), smaller size, lower opacity

### Visual Design

- **Background:** `#050505` with three floating gradient orbs (`orb-1`, `orb-2`, `orb-3`) on 25-35s animation loops, heavy blur. Hidden on mobile. Creates living ambient depth.
- **Cursor aura:** `CursorAura` component renders 5 concentric rings pulsing outward from cursor position (4.5s cycle, 0.9s stagger). Soft violet glow core follows cursor via direct DOM manipulation (`transform: translate()`, no React re-renders). Disabled on touch devices and when `prefers-reduced-motion` is set.
- **Color palette:** Violet accent (`#A78BFA`) with warm neutrals. Gradient text on display heading.
- **Typography:** Space Grotesk for display/headings, Inter for body. Journey slides use large centered text (2xl-5xl).
- **Social icons:** Brand-colored (LinkedIn blue, Instagram pink, YouTube red, GitHub/X light gray) with brightness hover.

### Data Layer

- All content in `src/constants/` (unchanged architecture).
- `socials.ts`: `personalInfo` with `focusLinks` array for inline hyperlinks in bio text.
- `experience.ts`: Locations added for USC ICT and Colby Investments. DSO competition added under Musician & Performer.

### Mobile Optimizations

- `100dvh` with `100vh` fallback for iOS Safari dynamic toolbar
- Cursor aura disabled on touch devices
- Slide overflow scroll enabled via CSS media query (mobile only)
- Responsive text sizing (unprefixed = mobile, `md:`/`lg:` = desktop)
- In Detail slide: headshot above bio on mobile, side-by-side on desktop (CSS `order`)
- Reduced padding on project rows (`py-5` vs `py-8`)
- Dot indicators simplified to plain dots (no labels, no grouping) for less visual clutter

## Future Plans

- **Credits roll:** Final slide will eventually become a cinematic scrolling credits sequence listing people to thank.
- **Journey expansion:** May add more narrative slides as the story grows.

## Consequences

### Positive

- Site has a unique identity -- not a generic portfolio template.
- Fade-show format forces visitors to slow down and engage with content.
- Journey slides add personal narrative that most portfolios lack.
- Atmospheric effects (orbs, cursor aura) create an immersive, introspective mood.
- Mobile experience fully tested and optimized.

### Negative

- 15 slides is a lot -- visitors may not scroll through all of them. Dot indicators and click/tap navigation mitigate this.
- No traditional scrolling means the UX is unfamiliar. Could confuse some visitors.

### Technical Notes

- Transition lock prevents rapid-fire slide changes (1s cooldown). All input methods share the same lock.
- `AnimatePresence mode="wait"` ensures clean exit before enter -- no overlapping slides.
- Cursor aura uses `ref` + direct `style.transform` updates for zero-lag tracking.
- Wheel handler uses accumulation + debounce to handle trackpad momentum scrolling.
- Touch handler matches touch identifiers for multi-touch safety.
- All animations respect `prefers-reduced-motion`.
- Space bar only captured when focus is not on interactive elements (a, button, input, textarea).
