# ADR-001: Portfolio Layout Redesign

**Status:** Superseded by ADR-002
**Date:** 2026-03-08
**Author:** Jacob J. Choi

---

## Context

The portfolio site had been using the same layout for ~7 months. Several structural issues had accumulated:

1. **Experience grid was 3-column (`md:grid-cols-3`) with 4 cards** -- the 4th card (projects) sat alone on a new row, creating visual imbalance.
2. **Stats cards ("4+ Active Projects", "22 Years Old")** were filler content with no real value to visitors (recruiters, collaborators, peers).
3. **Projects were crammed into a single card** alongside experience/certs -- despite being the primary showcase of technical work.
4. **Social links floated as unstyled text** at the bottom with no visual container or hierarchy.
5. **Header and photo were separated** into distinct sections, wasting vertical space and weakening the first impression.

## Decision

Redesign the single-page layout with the following structure:

### New Section Order

1. **Hero** -- Photo + name + title + email + status, side-by-side on desktop (`flex-row`). Replaces the separate Header component + profile grid.
2. **Bio** -- Full-width README card. No stats cards.
3. **Projects** -- 2x2 grid (`md:grid-cols-2`) with dedicated cards per project. Tech stacks rendered as pill badges. Linked titles with hover arrow.
4. **Experience** -- 2-column layout: `/current` (left) + `/past` (right).
5. **Bottom row** -- 2-column: `/certificates` (left) + `/connect` socials card (right).
6. **Footer** -- Unchanged.

### Key Changes

| Before | After |
|--------|-------|
| Photo in 1-col, header separate | Photo + identity side-by-side in hero |
| Stats cards (active projects, age) | Removed |
| 4 cards in 3-col grid (unbalanced) | Projects: 2x2 grid; Experience: 2-col; Bottom: 2-col |
| Tech stacks as plain text | Tech stacks as pill badges (`border`, `bg-cyan-400/5`) |
| Social links as floating text | Social links in `/connect` card with rows |
| Projects in one small card | Each project gets its own card with description + pills |
| Header as separate component import | Hero section inlined in page |

## Consequences

### Positive

- Projects are now the visual centerpiece, which reflects their importance in a portfolio.
- Experience cards have more vertical space, reducing density in the `/past` section (7 entries).
- Social links have a proper container and visual weight.
- Hero section is more compact and impactful -- photo + identity in one scan.
- All grid sections use consistent 2-column layouts on desktop, creating visual rhythm.

### Negative

- Header component (`src/components/Home/Header.tsx`) is now orphaned -- hero is inlined in `page.tsx`. Should be cleaned up or repurposed.
- Removing stats cards means losing a quick-glance data point. Acceptable because the bio text covers this context better.

### Neutral

- Mobile layout is unchanged (single-column stacking).
- All animations, design tokens, and accessibility features are preserved.
- No new dependencies or components introduced.

## Alternatives Considered

1. **Keep 3-column grid, add projects as 4th column** -- Rejected. 4-column grids are too dense on most screens and cards become too narrow for project descriptions.
2. **Separate projects page** -- Rejected. Single-page portfolio is a deliberate design choice. Adding routes adds complexity without clear benefit for a portfolio this size.
3. **Masonry/Pinterest-style layout** -- Rejected. Inconsistent card heights create visual noise. Grid alignment is cleaner for this content type.
