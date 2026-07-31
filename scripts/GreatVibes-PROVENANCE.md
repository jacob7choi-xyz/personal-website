# Great Vibes font provenance

`scripts/GreatVibes.ttf` is committed so that `scripts/generate-signature.cjs` can
regenerate `src/constants/signature.ts` from a clean clone. Embedded name-table
strings are not provenance, since a modified binary keeps them, so the binary is
identified by hash against a pinned upstream commit.

The machine-readable record is `scripts/asset-provenance.json`, enforced by
`npm run verify:provenance` in CI. This file is the human explanation.

| | |
|---|---|
| Repository | `google/fonts` (the Google Fonts distribution repo) |
| Commit | `a6039f387a790a092e417b4e8dbdd5b57fe4d6d4` (2024-03-28, "Great Vibes: Version 1.103; ttfautohint added") |
| Font path | `ofl/greatvibes/GreatVibes-Regular.ttf` |
| Font SHA-256 | `8d509802186f1b51572531ecf313e8098f9a5bfdfaca93f0c9b34467f9982d15` (457588 bytes) |
| Licence path | `ofl/greatvibes/OFL.txt` |
| Licence SHA-256 | `61093a21f5e63dedf54222b3c09997e54c0fe43e3851d21386e02ddcbc246d49` (4399 bytes) |
| Licence | SIL Open Font License 1.1 |
| Reviewed | 2026-07-30 |

**Pinned to a commit, deliberately.** An earlier version of this record pointed at
`main`, which is mutable: a later upstream commit could replace that file and the
re-verification command would then fetch something other than what was reviewed.
Both hashes above were confirmed against the pinned commit, not against a branch.

**Which upstream matters.** This binary does NOT match
`googlefonts/great-vibes@master:fonts/ttf/GreatVibes-Regular.ttf`, which is a
different build (459272 bytes,
`f5cbf7a0a129339980e01ad9563d23000446824a099f95521a142cdea95d9212`). Ours came from
the distribution repo, not the source repo. Both are the same project under the
same licence, but only one is byte-identical to what is committed here, and the
licence was taken from the same commit as the binary rather than a different
distribution.

## Re-verifying by hand

`-f` so an HTTP error fails loudly instead of being hashed as if it were content.

```sh
shasum -a 256 scripts/GreatVibes.ttf scripts/GreatVibes-OFL.txt

C=a6039f387a790a092e417b4e8dbdd5b57fe4d6d4
curl -fsL "https://raw.githubusercontent.com/google/fonts/$C/ofl/greatvibes/GreatVibes-Regular.ttf" | shasum -a 256
curl -fsL "https://raw.githubusercontent.com/google/fonts/$C/ofl/greatvibes/OFL.txt" | shasum -a 256
```

## What is enforced automatically

- `npm run verify:provenance` hashes the committed assets and compares them against
  `asset-provenance.json`. Offline by design, so it cannot be weakened by network
  conditions. Verified to fail on: a one-byte font change, a modified licence, a
  deleted asset, a hash edited in the record, and an upstream recorded as a branch
  rather than a commit SHA.
- `npm run verify:signature` regenerates the signature in memory and compares it to
  the committed artifact, so a font or dependency change cannot silently alter it.

Together these mean a font swap has to be a deliberate, reviewable edit: the
provenance record must change in the same commit, and the regenerated signature
must be accepted explicitly.
