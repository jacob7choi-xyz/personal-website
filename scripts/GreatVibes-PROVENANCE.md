# Great Vibes font provenance

`scripts/GreatVibes.ttf` is committed so that `scripts/generate-signature.cjs` can
regenerate `src/constants/signature.ts` from a clean clone. Embedded name-table
strings are not provenance, since any modified binary keeps them, so the binary is
recorded by hash instead.

| | |
|---|---|
| Source | `google/fonts`, the Google Fonts distribution repository |
| Path | `ofl/greatvibes/GreatVibes-Regular.ttf` |
| SHA-256 | `8d509802186f1b51572531ecf313e8098f9a5bfdfaca93f0c9b34467f9982d15` |
| Size | 457588 bytes |
| Licence | SIL Open Font License 1.1, text in `GreatVibes-OFL.txt` |
| Verified | 2026-07-30 |

**Note on which upstream.** The font does NOT match
`googlefonts/great-vibes@master:fonts/ttf/GreatVibes-Regular.ttf`, which is a
different build (459272 bytes,
`f5cbf7a0a129339980e01ad9563d23000446824a099f95521a142cdea95d9212`). Ours came
from the distribution repo, not the source repo. Both are the same project under
the same licence; recording which one matters because only one is byte-identical
to what is committed here.

`GreatVibes-OFL.txt` was verified byte-identical to
`google/fonts:ofl/greatvibes/OFL.txt`, so the licence travels with the same
distribution as the binary.

To re-verify:

```
shasum -a 256 scripts/GreatVibes.ttf
curl -sL https://github.com/google/fonts/raw/main/ofl/greatvibes/GreatVibes-Regular.ttf | shasum -a 256
```

Changing the font changes the generated signature path, so `npm run verify:signature`
will fail until the regenerated artifact is reviewed and committed.
