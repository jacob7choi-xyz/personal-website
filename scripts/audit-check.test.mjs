#!/usr/bin/env node
/**
 * Deterministic fixture tests for the advisory gate.
 *
 * This exists because audit-check.mjs is a custom security decision engine, and
 * a gate that fails open is worse than no gate: it produces a green check that
 * looks authoritative. Every case below is a way the gate could wrongly pass, or
 * a policy rule whose absence would be a latent security state.
 *
 * No test framework on purpose. Each case writes its own audit document AND its
 * own allowlist, then invokes the real script as a subprocess.
 *
 * Cases assert the exit code AND the specific failure code. Exit status alone is
 * a false-positive trap: a fixture intended to exercise duplicate detection could
 * instead fail on malformed metadata and still be recorded as passing, leaving
 * the control it was meant to cover completely untested.
 *
 *   node scripts/audit-check.test.mjs
 */

import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, "audit-check.mjs");
const dir = mkdtempSync(join(tmpdir(), "audit-fixtures-"));

/** An npm-audit-shaped document. `counters` can override the metadata block. */
function report(advisories, counters) {
  const bySeverity = { info: 0, low: 0, moderate: 0, high: 0, critical: 0 };
  for (const a of advisories) bySeverity[a.severity] = (bySeverity[a.severity] ?? 0) + 1;
  return {
    auditReportVersion: 2,
    vulnerabilities: Object.fromEntries(
      advisories.map((a) => [
        a.name,
        {
          name: a.name,
          severity: a.severity,
          via: [
            a.via ?? {
              source: 1,
              name: a.name,
              title: a.title ?? "fixture advisory",
              url: `https://github.com/advisories/${a.id}`,
              severity: a.severity,
              range: "<1.0.0",
            },
          ],
          effects: [],
          range: "<1.0.0",
          nodes: [],
          fixAvailable: false,
        },
      ])
    ),
    metadata: {
      vulnerabilities: { ...bySeverity, total: advisories.length, ...(counters ?? {}) },
    },
  };
}

const list = (...exceptions) => ({ exceptions });
const EXC = {
  advisory: "GHSA-r28c-9q8g-f849",
  package: "postcss",
  approvedSeverity: "high",
  expires: "2099-01-01",
  reason: "fixture",
};
const ADV = { id: "GHSA-r28c-9q8g-f849", name: "postcss", severity: "high" };

const cases = [
  { n: 1, what: "only approved advisories", expect: 0, audit: report([ADV]), allow: list(EXC) },
  { n: 2, code: "E_UNAPPROVED", what: "a NEW unapproved advisory", expect: 1, audit: report([{ id: "GHSA-0000-new0-0000", name: "left-pad", severity: "high" }]), allow: list() },
  { n: 3, code: "E_SEVERITY_EXCEEDED", what: "severity now EXCEEDS what was approved", expect: 1, audit: report([ADV]), allow: list({ ...EXC, approvedSeverity: "moderate" }) },
  { n: 4, code: "E_UNAPPROVED", what: "approved advisory via a DIFFERENT package", expect: 1, audit: report([{ ...ADV, name: "other-pkg" }]), allow: list(EXC) },
  { n: 5, code: "E_CRITICAL", what: "critical advisory whose ID is allowlisted anyway", expect: 1, audit: report([{ ...ADV, severity: "critical" }]), allow: list(EXC) },
  { n: 6, what: "clean report, empty allowlist", expect: 0, audit: report([]), allow: list() },
  { n: 7, code: "E_EXPIRED", what: "expired exception", expect: 1, audit: report([ADV]), allow: list({ ...EXC, expires: "2000-01-01" }) },

  /* --- indeterminate inputs: must never be read as "clean" --- */
  { n: 8, code: "E_AUDIT_ERROR", what: "registry/network failure shape (error key)", expect: 1, audit: { error: { code: "ENOTFOUND", summary: "registry unreachable" } }, allow: list() },
  { n: 9, code: "E_AUDIT_JSON", what: "truncated / invalid JSON", expect: 1, raw: '{"vulnerabilities": {"postcss": ', allow: list() },
  { n: 10, code: "E_AUDIT_SCHEMA", what: "no vulnerabilities key", expect: 1, audit: { auditReportVersion: 2 }, allow: list() },
  { n: 11, code: "E_AUDIT_SCHEMA", what: "no metadata block", expect: 1, audit: { vulnerabilities: {} }, allow: list() },
  { n: 12, code: "E_AUDIT_JSON", what: "empty stdout / empty file", expect: 1, raw: "", allow: list() },
  { n: 13, code: "E_AUDIT_SEVERITY", what: "unrecognised severity on an advisory", expect: 1, audit: report([{ ...ADV, severity: "high", via: { source: 1, name: "postcss", url: "https://github.com/advisories/GHSA-r28c-9q8g-f849", severity: "spicy" } }]), allow: list(EXC) },

  /* --- nested schema drift: the fail-open path this suite was extended for --- */
  {
    n: 14,
    code: "E_AUDIT_ADVISORY_SHAPE",
    what: "advisory object with an UNKNOWN shape (no url)",
    expect: 1,
    audit: report([{ ...ADV, via: { id: "GHSA-AAAA-BBBB-CCCC", name: "postcss", severity: "high" } }]),
    allow: list(EXC),
  },
  {
    n: 15,
    code: "E_AUDIT_SCHEMA",
    what: "via is not an array",
    expect: 1,
    audit: { auditReportVersion: 2, vulnerabilities: { postcss: { name: "postcss", severity: "high", via: "postcss" } }, metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 1, critical: 0, total: 1 } } },
    allow: list(EXC),
  },
  {
    n: 16,
    code: "E_CRITICAL",
    what: "metadata reports a CRITICAL that no advisory object exposes",
    expect: 1,
    audit: report([ADV], { critical: 1, total: 1 }),
    allow: list(EXC),
  },
  {
    n: 17,
    code: "E_ORACLE_MISMATCH",
    what: "metadata total > 0 but nothing extractable (parser blinded)",
    expect: 1,
    audit: { auditReportVersion: 2, vulnerabilities: {}, metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 1, critical: 0, total: 1 } } },
    allow: list(),
  },
  {
    n: 18,
    code: "E_ORACLE_MISMATCH",
    what: "metadata total 0 but advisories present (contradiction)",
    expect: 1,
    audit: report([ADV], { high: 0, total: 0 }),
    allow: list(EXC),
  },
  { n: 19, code: "E_AUDIT_COUNTER", what: "non-integer vulnerability counter", expect: 1, audit: report([ADV], { total: "1" }), allow: list(EXC) },
  { n: 20, code: "E_AUDIT_COUNTER", what: "negative vulnerability counter", expect: 1, audit: report([ADV], { total: -1 }), allow: list(EXC) },

  /* --- allowlist integrity --- */
  { n: 21, code: "E_ALLOWLIST_DUPLICATE", what: "duplicate exception keys (order-dependent policy)", expect: 1, audit: report([ADV]), allow: list(EXC, { ...EXC, approvedSeverity: "moderate" }) },
  { n: 22, code: "E_UNUSED", what: "UNUSED exception is dormant suppression authority", expect: 1, audit: report([]), allow: list(EXC) },
  { n: 23, code: "E_ALLOWLIST_CRITICAL", what: "exception approving critical", expect: 1, audit: report([]), allow: list({ ...EXC, approvedSeverity: "critical" }) },
  { n: 24, code: "E_ALLOWLIST_FIELD", what: "exception missing a required field", expect: 1, audit: report([]), allow: list({ ...EXC, reason: "" }) },
  { n: 25, code: "E_ALLOWLIST_DATE", what: "malformed expires date", expect: 1, audit: report([ADV]), allow: list({ ...EXC, expires: "Oct 27 2026" }) },
  { n: 26, code: "E_ALLOWLIST_JSON", what: "allowlist is not valid JSON", expect: 1, audit: report([]), rawAllow: "{ nope", },
  { n: 27, code: "E_ALLOWLIST_SHAPE", what: "allowlist missing exceptions array", expect: 1, audit: report([]), rawAllow: "{}" },

  /* --- calendar validity: JS silently normalises impossible days, so the
         regex plus a NaN check is not enough. Verified: 2026-02-31 becomes
         2026-03-03 and 2026-02-29 becomes 2026-03-01. --- */
  { n: 28, code: "E_ALLOWLIST_DATE", what: "impossible day of month (2026-02-31)", expect: 1, audit: report([ADV]), allow: list({ ...EXC, expires: "2026-02-31" }) },
  { n: 29, code: "E_ALLOWLIST_DATE", what: "Feb 29 in a NON-leap year (2026-02-29)", expect: 1, audit: report([ADV]), allow: list({ ...EXC, expires: "2026-02-29" }) },
  { n: 30, code: "E_ALLOWLIST_DATE", what: "April 31 (2026-04-31)", expect: 1, audit: report([ADV]), allow: list({ ...EXC, expires: "2026-04-31" }) },
  { n: 31, code: "E_ALLOWLIST_DATE", what: "month out of range (2026-13-01)", expect: 1, audit: report([ADV]), allow: list({ ...EXC, expires: "2026-13-01" }) },
  { n: 32, what: "Feb 29 in a REAL leap year (2028-02-29) is accepted", expect: 0, audit: report([ADV]), allow: list({ ...EXC, expires: "2028-02-29" }), now: "2027-01-01T00:00:00Z" },

  /* --- expiry is EXCLUSIVE at 00:00 UTC; prove the exact boundary --- */
  { n: 33, what: "1ms before expiry still suppresses", expect: 0, audit: report([ADV]), allow: list({ ...EXC, expires: "2026-10-27" }), now: "2026-10-26T23:59:59.999Z" },
  { n: 34, code: "E_EXPIRED", what: "exactly at 00:00 UTC on the expiry date does NOT", expect: 1, audit: report([ADV]), allow: list({ ...EXC, expires: "2026-10-27" }), now: "2026-10-27T00:00:00.000Z" },

  /* --- the via GRAPH, not just its syntax. Every reported package must resolve
         to an advisory object. Existing references and consistent counters are
         not enough. --- */
  {
    n: 35,
    code: "E_AUDIT_VIA_GRAPH",
    what: "A<->B cycle with no advisory, alongside an approved C (refs all exist, counters agree)",
    expect: 1,
    audit: {
      auditReportVersion: 2,
      vulnerabilities: {
        A: { name: "A", severity: "high", via: ["B"], effects: [], range: "*", nodes: [], fixAvailable: false },
        B: { name: "B", severity: "high", via: ["A"], effects: [], range: "*", nodes: [], fixAvailable: false },
        postcss: {
          name: "postcss",
          severity: "high",
          via: [{ source: 1, name: "postcss", title: "real", url: "https://github.com/advisories/GHSA-r28c-9q8g-f849", severity: "high", range: "*" }],
          effects: [], range: "*", nodes: [], fixAvailable: false,
        },
      },
      metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 3, critical: 0, total: 3 } },
    },
    allow: list(EXC),
  },
  {
    n: 36,
    code: "E_AUDIT_VIA_REF",
    what: "string reference to a package that is not a reported vulnerability",
    expect: 1,
    audit: {
      auditReportVersion: 2,
      vulnerabilities: {
        A: { name: "A", severity: "high", via: ["ghost-package"], effects: [], range: "*", nodes: [], fixAvailable: false },
      },
      metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 1, critical: 0, total: 1 } },
    },
    allow: list(),
  },
  {
    n: 37,
    code: "E_AUDIT_VIA_GRAPH",
    what: "dead-end entry with an empty via array",
    expect: 1,
    audit: {
      auditReportVersion: 2,
      vulnerabilities: {
        A: { name: "A", severity: "high", via: [], effects: [], range: "*", nodes: [], fixAvailable: false },
      },
      metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 1, critical: 0, total: 1 } },
    },
    allow: list(),
  },
  {
    n: 38,
    what: "a LEGITIMATE meta-vulnerability chain resolves (A -> B -> advisory)",
    expect: 0,
    audit: {
      auditReportVersion: 2,
      vulnerabilities: {
        A: { name: "A", severity: "high", via: ["B"], effects: [], range: "*", nodes: [], fixAvailable: false },
        B: { name: "B", severity: "high", via: ["postcss"], effects: [], range: "*", nodes: [], fixAvailable: false },
        postcss: {
          name: "postcss",
          severity: "high",
          via: [{ source: 1, name: "postcss", title: "real", url: "https://github.com/advisories/GHSA-r28c-9q8g-f849", severity: "high", range: "*" }],
          effects: [], range: "*", nodes: [], fixAvailable: false,
        },
      },
      metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 3, critical: 0, total: 3 } },
    },
    allow: list(EXC),
  },
];

let failed = 0;
for (const c of cases) {
  const auditPath = join(dir, `audit-${c.n}.json`);
  const allowPath = join(dir, `allow-${c.n}.json`);
  writeFileSync(auditPath, c.raw !== undefined ? c.raw : JSON.stringify(c.audit));
  writeFileSync(allowPath, c.rawAllow !== undefined ? c.rawAllow : JSON.stringify(c.allow));

  const argv = [SCRIPT, "--input", auditPath, "--allowlist", allowPath];
  if (c.now) argv.push("--now", c.now);
  const run = spawnSync(process.execPath, argv, { encoding: "utf8" });

  /* Exit code alone is a false-positive trap: a fixture meant to exercise
     duplicate detection could instead fail on malformed metadata and still
     "pass". So when a code is expected, require the intended control to be the
     one that fired. */
  const exitOk = run.status === c.expect;
  const out = `${run.stdout ?? ""}${run.stderr ?? ""}`;
  const codeOk = !c.code || out.includes(`[${c.code}]`);
  const ok = exitOk && codeOk;
  if (!ok) failed++;
  const label = c.expect === 0 ? "should PASS" : `should FAIL with ${c.code ?? "any"}`;
  console.log(
    `  ${ok ? "ok  " : "FAIL"} case ${String(c.n).padStart(2)}: ${c.what} (${label}, got exit ${run.status}${c.code ? `, code ${codeOk ? "match" : "MISMATCH"}` : ""})`
  );
  if (!ok) console.log(`        stdout: ${run.stdout?.trim()}\n        stderr: ${run.stderr?.trim()}`);
}

/* Argument handling is part of the trust boundary too. */
for (const [argv, what] of [
  [["--input"], "--input with no value"],
  [["--bogus", "x"], "unrecognised argument"],
  [["--now", "not-a-date"], "--now with an invalid timestamp"],
]) {
  const run = spawnSync(process.execPath, [SCRIPT, ...argv], { encoding: "utf8" });
  const out = `${run.stdout ?? ""}${run.stderr ?? ""}`;
  const ok = run.status === 1 && out.includes("[E_ARGS]");
  if (!ok) failed++;
  console.log(`  ${ok ? "ok  " : "FAIL"} args: ${what} (should FAIL with E_ARGS, got ${run.status})`);
}

rmSync(dir, { recursive: true, force: true });

if (failed) {
  console.error(`\naudit-check tests: ${failed} FAILED`);
  process.exit(1);
}
console.log(`\naudit-check tests: all ${cases.length + 3} passed`);
