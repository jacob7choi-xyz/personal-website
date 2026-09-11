# Dependency advisory dispositions

Machine-enforced by `scripts/audit-check.mjs` against `.github/audit-allowlist.json`.
This file carries the reasoning; the allowlist carries the decisions the gate reads.

**Evidence date: 2026-09-11.** There are currently no accepted risk exceptions.
Any entry added later must carry an expiry, because a risk acceptance without one
becomes a permanent blind spot. On expiry the gate fails until that entry is
re-reviewed. That is intentional.

## How to read this

Three separate questions, deliberately not collapsed:

1. **Does the vulnerability exist in our tree?** Yes for everything listed here.
2. **Are its exploit preconditions satisfied by this application?** No, for every
   entry, under the assumptions below.
3. **Is the risk eliminated?** No. It is accepted, dated, and expiring.

Note that `npm audit --omit=dev` reports the **production dependency graph**,
which is not the same as code that runs when a visitor makes a request. `postcss`
is the clearest example: it is in the production graph but is a build-time
processor here. Dispositions below use execution phase, not npm's dev flag.

## Assumptions this disposition rests on

If any of these stops being true, **re-review immediately** rather than waiting
for expiry:

- No user-supplied content of any kind. No uploads, no CMS, no API routes, no
  auth, no forms. All content is developer-authored constants.
- No user-supplied or third-party CSS. Only first-party CSS, processed at build.
- `next.config.mjs` declares no `remotePatterns`, so `next/image` cannot be
  pointed at a remote or attacker-chosen image.
- Exactly one image asset, owned by this repository.
- Build inputs are trusted: the repository itself and the lockfile.
- No attacker-controlled glob patterns in lint or build configuration.

## Current dispositions

**None.** `.github/audit-allowlist.json` carries an empty `exceptions` array, and
`npm audit` reports zero advisories across the whole tree.

This is the intended steady state, not a gap in the record. Every disposition this
file used to carry was retired by upgrading, not by re-accepting it, on
2026-09-11. What that took is recorded below.

With no entries there is no expiry to defend and nothing suppressed. The next
advisory to appear fails the gate on its own merits and has to be argued from
scratch, which is the correct default.

### Why not force the versions with `overrides`

Considered and rejected for now. Pinning a transitive dependency out from under a
framework makes us the owner of a compatibility contract we cannot test as
thoroughly as the framework does. Security-first does not mean driving a scanner
count to zero at any cost. If an advisory here becomes request-time reachable, an
override becomes justified and must then be verified by build and by rendering,
not merely by a green audit.

### Resolved since this document was written

**2026-09-11: every remaining disposition cleared by upgrade.** Two critical
Next.js advisories were published on 2026-09-08: GHSA-2xp9-vwfh-vxw4,
unauthenticated RCE in the Image Optimization API when AVIF files are used, and
GHSA-p293-qw3h-jr36, unauthenticated RCE on Windows-hosted servers at CVSS 9.0.
Only the first is reachable on this deployment, since Vercel is Linux and the
site does serve an optimised image. Neither was exceptable in any case: the
policy refuses to approve `critical` at any severity ceiling, so the only route
was the patch. Moving `next` 16.2.12 to 16.3.4 closed both and pulled newer
`postcss` and `sharp` along with it, which retired all four exceptions this file
previously listed.

Three findings survived that upgrade and were then closed by in-range updates
rather than by exception, because each parent's declared range already admitted
the patched version:

| Advisory | Package | Was | Now | Admitted by |
|---|---|---|---|---|
| GHSA-2v37-7h3g-55p8 | nanoid | 3.3.16 | 3.3.19 | `postcss` declares `^3.3.16` |
| GHSA-2883-xcg3-v3hh | js-yaml | 4.3.1 | 4.3.2 | `@eslint/eslintrc` declares `^4.3.0` |
| GHSA-w9m9-85wc-3x92 | postcss-selector-parser | 6.1.2 | 6.1.4 | `tailwindcss` declares `^6.1.2` |

The general lesson is worth recording, because an earlier revision of this file
reasoned its way to a written exception for advisories in exactly this shape:
**check the parent's declared range before drafting a disposition.** All three
were already satisfiable by `npm update`, needing no `overrides` and no risk
acceptance. An exception is the right instrument only when the graph genuinely
cannot select a patched version. That was true of the old `postcss` and `sharp`
entries when they were written, and it is precisely what stopped being true here.

**GHSA-mh99-v99m-4gvg (`brace-expansion`)** was accepted as dev-and-CI-only. On
2026-07-31 a lockfile refresh, carried in an unrelated `framer-motion` update,
pulled `brace-expansion` to **5.0.8**, the patched version, and npm stopped
reporting it. Its exception was removed the same day.

Worth recording how that surfaced: nobody noticed by reading the diff. The gate
failed with `E_UNUSED`, because an exception that no longer matches a reported
advisory is dormant suppression authority: if a future dependency change
reintroduced the advisory, the stale entry would have suppressed it silently with
no human re-review. The friction was the point.

### The ESLint 8 chain, resolved

This file used to explain why the ESLint 8 toolchain findings stayed open:
clearing them meant a real migration to ESLint 9 and flat config, not a version
bump. That migration shipped on 2026-07-31 in `3ccbcdd`, and the last survivor of
the chain, `js-yaml`, closed on 2026-09-11. The durable half of the argument
still stands and is why the note is kept: dev dependencies remain in the threat
model, because they execute during install, lint, build and CI. Their correct
priority is lower, never zero.

## Controls

| Control | Where | What it catches |
|---|---|---|
| Pre-merge gate | `push` and `pull_request` in `.github/workflows/ci.yml` | Stops a change from shipping while an unapproved advisory exists |
| Scheduled scan | weekly `schedule` in the same workflow | Environmental drift: an advisory published, or an exception expiring, on a day with no commits |
| Fail-closed evaluator | `scripts/audit-check.mjs` | Unreachable registry, malformed output, schema drift **including an advisory object whose shape it does not recognise**, unknown advisory, expired or exceeded exception, unused exception, any critical |
| Counter cross-check | same script, `crossCheck()` | Parser drift hiding findings npm is itself reporting: `metadata.critical > 0` fails unconditionally, and any contradiction between npm's counters and the parsed advisory list is indeterminate. **Not an independent oracle:** both views come from the same audit document, produced by the same npm process from the same registry data |
| Graph completeness | same script, `assertViaGraphResolves()` | `via` is a graph, not a list. Every reported vulnerable package must resolve to an advisory object, so an unexplained component cannot hide behind existing references and consistent counters |
| Fixture-mode coupling | `parseArgs()` | `--now` and a custom `--allowlist` are rejected without `--input`, so a live audit can never be evaluated under fictional policy time or a substituted policy |
| Evaluator tests | `scripts/audit-check.test.mjs` | The ways the gate itself could wrongly pass: malformed and truncated documents, unsupported report versions, unrecognised advisory shapes, counter contradictions, meta-vulnerability graph failures, allowlist integrity, expiry boundaries, and argument misuse. Each case asserts a specific failure code, and legitimate inputs are covered too so the suite also proves the gate is not over-strict. CI prints the current count; it is deliberately not written down here |

### Policy semantics worth knowing before editing the allowlist

- **`expires` is EXCLUSIVE**, evaluated at 00:00 UTC. An exception applies while
  `now < expires`, so the listed date is the first day it no longer suppresses.
  Proven by fixtures 1ms either side of the boundary, not just asserted.
- **`expires` must be a real calendar date.** A regex plus a NaN check is not
  enough: JavaScript silently normalises impossible days in this format, verified
  as `2026-02-31 -> 2026-03-03`, `2026-02-29 -> 2026-03-01` (2026 is not a leap
  year) and `2026-04-31 -> 2026-05-01`. A reviewer could therefore write one
  expiry and the policy would quietly use another. The value is round-tripped
  back to a string, so no security rule here depends on a date parser correcting
  human input.
- **Every failure carries a stable machine code** (`E_UNAPPROVED`, `E_EXPIRED`,
  `E_UNUSED`, `E_CRITICAL`, `E_ALLOWLIST_DUPLICATE`, `E_AUDIT_ADVISORY_SHAPE`,
  `E_ORACLE_MISMATCH`, and so on). Fixtures assert the code, so a test cannot pass
  because the wrong control fired.
- **An unused exception is FATAL, not hygiene.** Every entry must match a
  currently reported advisory. An unused but unexpired entry is dormant
  suppression authority: if a dependency change reintroduced the advisory it would
  be suppressed again with no human re-review. When an advisory disappears,
  delete its entry. Expect CI to go red until you do; that friction is the point.
- **An exception is IDENTIFIED by advisory + package.** One policy record per
  GHSA/package, which is why duplicates are rejected: a lookup over duplicates
  would make the policy order-dependent. Maximum approved severity and exclusive
  expiry are **constraints on** that record, not part of its identity. Do not
  treat "same GHSA and package, different expiry" as a legitimate second key.
- **`via` is a graph and must resolve, not merely reference.** Every reported
  package has to reach at least one advisory object. A cycle (`A -> B`, `B -> A`)
  with no advisory in that component previously passed, because every reference
  existed and the aggregate counters agreed, while the component was entirely
  unexplained. The rule was checked against the then-current dependency tree
  before adoption, confirming every reported package already resolved, so it was
  not introduced on the assumption that real output would satisfy it.
- **The npm audit report version is pinned.** Every assumption in the evaluator is
  written against version 2. A future version could keep these field names and
  change their semantics, and evaluating it under version 2 assumptions is exactly
  the silent misinterpretation this gate exists to prevent, so a version bump
  fails closed and forces the parser to be re-read.

**A note on this document:** it deliberately avoids recording counts, whether of
test cases, advisories, or dependency-graph edges. Those change with every
lockfile update without changing any security property, and a stale count in a
security document is worse than no count. State the invariant; let the tooling
report the number. (This file previously said "29 cases" while the suite had grown
past it, which is exactly the failure mode.)
- **An advisory object the parser cannot read is indeterminate, never clean.**
  Verified: the previous revision of this gate reported "0 distinct advisories,
  PASS" on a document where npm was reporting one high vulnerability, because it
  silently skipped an advisory object with an unfamiliar shape. That was a false
  green, and it is what the nested schema assertions and the counter oracle exist
  to prevent.

### Trust boundary: npm registry audit data is a trusted external input

The gate can prove the report it received is well-formed and that every finding is
either unapproved or covered by an unexpired exception. It cannot prove the report
is **true**. If the registry returned a syntactically valid but incomplete or
falsified advisory set, no amount of local parsing would detect it.

That is an inherent oracle assumption, named rather than solved. Building a second
independent scanner (OSV, GitHub Advisory API) to cross-check would be
disproportionate for a static portfolio. Dependabot provides some ecosystem
diversity but is not a synchronous second oracle for this gate.

Related runtime assumption: **npm itself is part of this control's contract.**
`.nvmrc` pins a Node major, and npm patches float within it, which is deliberate
(freezing npm to stabilise a JSON shape would trade a security-patching problem
for a parsing convenience). Schema drift is absorbed by failing closed on anything
unrecognised, so a new npm becomes a loud investigation, never a silent pass.

### Threat model limit: the gate is in-repo

Branch protection makes this check a precondition for `main`, which is strong
against accidental dependency drift, forgotten audits, expired waivers and routine
Dependabot changes. It is **not** an independent trust boundary against a change
that edits the gate itself: a pull request can modify `scripts/audit-check.mjs` or
`.github/audit-allowlist.json`, and the check then evaluates the modified policy.

For a single-maintainer repository where every change is self-reviewed, that is
accepted rather than solved. `.github/CODEOWNERS` marks the security-relevant paths
so review is required on them if collaborators ever appear. Building an external
policy service would be disproportionate here.

Scheduled workflows on public repositories can be disabled after 60 days without
activity, so **the pre-merge gate remains authoritative**. The schedule is
detection, not enforcement: a failing scheduled scan does not and must not
undeploy anything, it reports that the threat environment changed after the code
was accepted.

**The audit workflow stays read-only** (`permissions: contents: read`). Do not
add deployment credentials or a deploy hook to it for any reason. A scheduled
audit, a scheduled build, and a scheduled production deployment are three
different things with three different privilege requirements, and only the first
belongs here.

**The npm CLI is part of this control's contract.** `node-version: 20` floats
across Node and bundled npm releases, which can change the audit JSON shape. That
is handled by asserting the schema and failing closed on anything unrecognised, so
version drift becomes a loud investigation rather than a silent "no
vulnerabilities found". Do not relax that assertion to reduce noise.

If the registry is unreachable the gate fails, by design: not being able to
determine safety is not the same as being safe. The escape hatch for a genuine
outage is a deliberate, attributable administrative bypass, never an environment
variable that silently disables the check.

## Re-review triggers

With an empty allowlist the gate is itself the trigger: a new advisory fails CI on
the next push or the next weekly scan. These remain the changes that should prompt
a deliberate re-read of the assumptions above, rather than waiting for a scanner to
speak first:

- A dependency upgrade that changes which version of `next`, `postcss`, `sharp`
  or the lint toolchain is installed.
- Any change to `next.config.mjs`, especially adding `remotePatterns` or image
  configuration.
- Introducing user-supplied content, uploads, forms, API routes or auth.
- Introducing third-party or user-supplied CSS.
- Any advisory here being reported at a higher severity, or through a new
  dependency path.
