# Dependency advisory dispositions

Machine-enforced by `scripts/audit-check.mjs` against `.github/audit-allowlist.json`.
This file carries the reasoning; the allowlist carries the decisions the gate reads.

**Evidence date: 2026-07-29.** Every disposition below expires **2026-10-27**. On
expiry the gate fails until each entry is re-reviewed. That is intentional. A
risk acceptance without an expiry becomes a permanent blind spot.

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

| Advisory | Package | Installed | Patched upstream | Dependency path | Execution phase | Exploit precondition | Present here | Severity | Accepted until |
|---|---|---|---|---|---|---|---|---|---|
| GHSA-r28c-9q8g-f849 | postcss | 8.4.31 | **8.5.18** | app -> next -> postcss | build | attacker-controlled CSS or `sourceMappingURL` | No | high | 2026-10-27 |
| GHSA-6g55-p6wh-862q | postcss | 8.4.31 | **8.5.12** | app -> next -> postcss | build | attacker-controlled `sourceMappingURL` | No | high | 2026-10-27 |
| GHSA-qx2v-qp2m-jg93 | postcss | 8.4.31 | **8.5.10** | app -> next -> postcss | build | user-controlled CSS stringified into HTML | No | moderate | 2026-10-27 |
| GHSA-f88m-g3jw-g9cj | sharp | 0.34.5 | **0.35.0** | app -> next -> sharp | build (image optimisation) | processing an untrusted image | No | high | 2026-10-27 |
| GHSA-mh99-v99m-4gvg | brace-expansion | <=5.0.7 | **5.0.8** | app -> eslint-config-next -> ... | dev and CI only | pathological expansion input in our own config | No | high | 2026-10-27 |

**A patch exists upstream for every one of these.** None is unfixable. The
accurate statement is that the current `next@15.5.22` dependency graph does not
select them, and `npm audit fix` cannot reach them: its only computed remedy is a
downgrade to `next@9.3.3`, which is not a remedy.

Our **direct** `postcss` devDependency is already 8.5.25 and is not affected. The
exposure is the 8.4.31 copy pinned inside `next`.

### Why not force the versions with `overrides`

Considered and rejected for now. Pinning a transitive dependency out from under a
framework makes us the owner of a compatibility contract we cannot test as
thoroughly as the framework does. Security-first does not mean driving a scanner
count to zero at any cost. If an advisory here becomes request-time reachable, an
override becomes justified and must then be verified by build and by rendering,
not merely by a green audit.

### Why the ESLint 8 chain is not cleared

`brace-expansion` and the other toolchain findings resolve by moving to ESLint 9
and flat config. That is a real migration, not a version bump, and it is not
justified by a DoS that requires us to attack our own lint config. Dev
dependencies are still in the threat model, because they execute during install,
lint, build and CI, which is genuine supply-chain surface. The correct priority
is lower, not zero.

## Controls

| Control | Where | What it catches |
|---|---|---|
| Pre-merge gate | `push` and `pull_request` in `.github/workflows/ci.yml` | Stops a change from shipping while an unapproved advisory exists |
| Scheduled scan | weekly `schedule` in the same workflow | Environmental drift: an advisory published, or an exception expiring, on a day with no commits |
| Fail-closed evaluator | `scripts/audit-check.mjs` | Unreachable registry, malformed output, schema drift **including an advisory object whose shape it does not recognise**, unknown advisory, expired or exceeded exception, unused exception, any critical |
| Independent counter oracle | same script, `crossCheck()` | Parser drift hiding findings npm is itself reporting: `metadata.critical > 0` fails unconditionally, and any contradiction between npm's counters and the parsed advisory list is indeterminate |
| Evaluator tests | `scripts/audit-check.test.mjs` | 29 cases covering the ways the gate itself could wrongly pass |

### Policy semantics worth knowing before editing the allowlist

- **`expires` is EXCLUSIVE**, evaluated at 00:00 UTC. An exception applies while
  `now < expires`, so the listed date is the first day it no longer suppresses.
- **An unused exception is FATAL, not hygiene.** Every entry must match a
  currently reported advisory. An unused but unexpired entry is dormant
  suppression authority: if a dependency change reintroduced the advisory it would
  be suppressed again with no human re-review. When an advisory disappears,
  delete its entry. Expect CI to go red until you do; that friction is the point.
- **Duplicate advisory + package entries are rejected**, since a lookup over
  duplicates would make the policy order-dependent.
- **An advisory object the parser cannot read is indeterminate, never clean.**
  Verified: the previous revision of this gate reported "0 distinct advisories,
  PASS" on a document where npm was reporting one high vulnerability, because it
  silently skipped an advisory object with an unfamiliar shape. That was a false
  green, and it is what the nested schema assertions and the counter oracle exist
  to prevent.

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

Ahead of the expiry date, re-review on any of:

- A dependency upgrade that changes which version of `postcss`, `sharp` or the
  lint toolchain is installed.
- Any change to `next.config.mjs`, especially adding `remotePatterns` or image
  configuration.
- Introducing user-supplied content, uploads, forms, API routes or auth.
- Introducing third-party or user-supplied CSS.
- Any advisory here being reported at a higher severity, or through a new
  dependency path.
