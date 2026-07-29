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
| Fail-closed evaluator | `scripts/audit-check.mjs` | Unreachable registry, malformed output, schema drift, unknown advisory, expired or exceeded exception, any critical |
| Evaluator tests | `scripts/audit-check.test.mjs` | The ways the gate itself could wrongly pass |

Scheduled workflows on public repositories can be disabled after 60 days without
activity, so **the pre-merge gate remains authoritative**. The schedule is
detection, not enforcement.

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
