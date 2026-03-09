# ADR-002: Fade Presentation Redesign

**Status:** Accepted
**Date:** 2026-03-09
**Author:** Jacob J. Choi

---

## Context

ADR-001's card-based layout was replaced with a clean Apple/Spotify-inspired design (violet accent, true black bg, scroll-triggered animations). That design felt flat and generic -- not world-class. Needed more sophistication, atmosphere, and intentionality.

## Decision

Complete rearchitecture from a scrolling page to a **full-viewport fade-show presentation** with atmospheric background effects.

### Architecture

- **No scrolling.** Page is locked to `100vh`, `overflow: hidden`.
- **Slide-based navigation.** Each section is a fixed-position full-viewport slide. Wheel, touch, and arrow key events trigger transitions between slides.
- **AnimatePresence mode="wait"** cross-fades between slides (0.9s duration, 1s lock between transitions).
- **Fade + blur + scale** transitions: content dissolves from `blur(14px) + scale(0.98) + opacity(0)` into focus.
- **Dot indicators** on the right edge for navigation and orientation.

### 14 Slides (in order)

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
| 8 | About Me | Bio text + headshot (50/50 grid) |
| 9 | Experience: Current | Two-column table layout |
| 10 | Experience: Previously | Two-column table layout |
| 11 | Credentials | Two-column table layout |
| 12 | Projects | Row-based list with tech tags |
| 13 | Footer | Contact info, copyright, "Built with Next.js" |

### Visual Design

- **Background:** `#050505` with three floating gradient orbs (`orb-1`, `orb-2`, `orb-3`) on 25-35s animation loops, heavy blur. Creates living ambient depth.
- **Cursor aura:** `CursorAura` component renders 5 concentric rings pulsing outward from cursor position (4.5s cycle, 0.9s stagger). Soft violet glow core follows cursor via direct DOM manipulation (no React re-renders).
- **Color palette:** Violet accent (`#A78BFA`) with warm neutrals. Gradient text on display heading. Gradient dividers with violet tint.
- **Typography:** Space Grotesk for display/headings, Inter for body. Journey slides use large centered text (2xl-5xl).
- **Social icons:** Brand-colored (LinkedIn blue, Instagram pink, YouTube red, GitHub/X light gray) with brightness hover.

### Data Layer

- All content in `src/constants/` (unchanged architecture).
- `socials.ts`: Added `focusLinks` array for inline hyperlinks in bio focus text (Turing study, HarmonyRestorer, TuneTales, custom OpGAN).
- `experience.ts`: No structural changes.

## Future Plans

- **Credits roll:** Final slide will eventually become a cinematic scrolling credits sequence listing people to thank.
- **Journey expansion:** May add more narrative slides as the story grows.

## Consequences

### Positive

- Site has a unique identity -- not a generic portfolio template.
- Fade-show format forces visitors to slow down and engage with content.
- Journey slides add personal narrative that most portfolios lack.
- Atmospheric effects (orbs, cursor aura) create an immersive, introspective mood.

### Negative

- 14 slides is a lot -- visitors may not scroll through all of them. Dot indicators mitigate this.
- No traditional scrolling means the UX is unfamiliar. Could confuse some visitors.
- Mobile experience needs testing (touch events are wired but not battle-tested).

### Technical Notes

- Transition lock prevents rapid-fire slide changes on wheel (1s cooldown). Arrow keys share the same lock.
- `AnimatePresence mode="wait"` ensures clean exit before enter -- no overlapping slides.
- Cursor aura uses `ref` + direct `style.left/top` updates for zero-lag tracking.
- All animations respect `prefers-reduced-motion`.
