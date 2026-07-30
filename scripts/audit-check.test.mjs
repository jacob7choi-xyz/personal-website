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
 * own allowlist, then invokes the real script as a subprocess and asserts only
 * the exit code.
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
  { n: 2, what: "a NEW unapproved advisory", expect: 1, audit: report([{ id: "GHSA-0000-new0-0000", name: "left-pad", severity: "high" }]), allow: list() },
  { n: 3, what: "severity now EXCEEDS what was approved", expect: 1, audit: report([ADV]), allow: list({ ...EXC, approvedSeverity: "moderate" }) },
  { n: 4, what: "approved advisory via a DIFFERENT package", expect: 1, audit: report([{ ...ADV, name: "other-pkg" }]), allow: list(EXC) },
  { n: 5, what: "critical advisory whose ID is allowlisted anyway", expect: 1, audit: report([{ ...ADV, severity: "critical" }]), allow: list(EXC) },
  { n: 6, what: "clean report, empty allowlist", expect: 0, audit: report([]), allow: list() },
  { n: 7, what: "expired exception", expect: 1, audit: report([ADV]), allow: list({ ...EXC, expires: "2000-01-01" }) },

  /* --- indeterminate inputs: must never be read as "clean" --- */
  { n: 8, what: "registry/network failure shape (error key)", expect: 1, audit: { error: { code: "ENOTFOUND", summary: "registry unreachable" } }, allow: list() },
  { n: 9, what: "truncated / invalid JSON", expect: 1, raw: '{"vulnerabilities": {"postcss": ', allow: list() },
  { n: 10, what: "no vulnerabilities key", expect: 1, audit: { auditReportVersion: 2 }, allow: list() },
  { n: 11, what: "no metadata block", expect: 1, audit: { vulnerabilities: {} }, allow: list() },
  { n: 12, what: "empty stdout / empty file", expect: 1, raw: "", allow: list() },
  { n: 13, what: "unrecognised severity on an advisory", expect: 1, audit: report([{ ...ADV, severity: "high", via: { source: 1, name: "postcss", url: "https://github.com/advisories/GHSA-r28c-9q8g-f849", severity: "spicy" } }]), allow: list(EXC) },

  /* --- nested schema drift: the fail-open path this suite was extended for --- */
  {
    n: 14,
    what: "advisory object with an UNKNOWN shape (no url)",
    expect: 1,
    audit: report([{ ...ADV, via: { id: "GHSA-AAAA-BBBB-CCCC", name: "postcss", severity: "high" } }]),
    allow: list(EXC),
  },
  {
    n: 15,
    what: "via is not an array",
    expect: 1,
    audit: { auditReportVersion: 2, vulnerabilities: { postcss: { name: "postcss", severity: "high", via: "postcss" } }, metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 1, critical: 0, total: 1 } } },
    allow: list(EXC),
  },
  {
    n: 16,
    what: "metadata reports a CRITICAL that no advisory object exposes",
    expect: 1,
    audit: report([ADV], { critical: 1, total: 1 }),
    allow: list(EXC),
  },
  {
    n: 17,
    what: "metadata total > 0 but nothing extractable (parser blinded)",
    expect: 1,
    audit: { auditReportVersion: 2, vulnerabilities: {}, metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 1, critical: 0, total: 1 } } },
    allow: list(),
  },
  {
    n: 18,
    what: "metadata total 0 but advisories present (contradiction)",
    expect: 1,
    audit: report([ADV], { high: 0, total: 0 }),
    allow: list(EXC),
  },
  { n: 19, what: "non-integer vulnerability counter", expect: 1, audit: report([ADV], { total: "1" }), allow: list(EXC) },
  { n: 20, what: "negative vulnerability counter", expect: 1, audit: report([ADV], { total: -1 }), allow: list(EXC) },

  /* --- allowlist integrity --- */
  { n: 21, what: "duplicate exception keys (order-dependent policy)", expect: 1, audit: report([ADV]), allow: list(EXC, { ...EXC, approvedSeverity: "moderate" }) },
  { n: 22, what: "UNUSED exception is dormant suppression authority", expect: 1, audit: report([]), allow: list(EXC) },
  { n: 23, what: "exception approving critical", expect: 1, audit: report([]), allow: list({ ...EXC, approvedSeverity: "critical" }) },
  { n: 24, what: "exception missing a required field", expect: 1, audit: report([]), allow: list({ ...EXC, reason: "" }) },
  { n: 25, what: "malformed expires date", expect: 1, audit: report([ADV]), allow: list({ ...EXC, expires: "Oct 27 2026" }) },
  { n: 26, what: "allowlist is not valid JSON", expect: 1, audit: report([]), rawAllow: "{ nope", },
  { n: 27, what: "allowlist missing exceptions array", expect: 1, audit: report([]), rawAllow: "{}" },
];

let failed = 0;
for (const c of cases) {
  const auditPath = join(dir, `audit-${c.n}.json`);
  const allowPath = join(dir, `allow-${c.n}.json`);
  writeFileSync(auditPath, c.raw !== undefined ? c.raw : JSON.stringify(c.audit));
  writeFileSync(allowPath, c.rawAllow !== undefined ? c.rawAllow : JSON.stringify(c.allow));

  const run = spawnSync(process.execPath, [SCRIPT, "--input", auditPath, "--allowlist", allowPath], {
    encoding: "utf8",
  });
  const ok = run.status === c.expect;
  if (!ok) failed++;
  const label = c.expect === 0 ? "should PASS" : "should FAIL CLOSED";
  console.log(
    `  ${ok ? "ok  " : "FAIL"} case ${String(c.n).padStart(2)}: ${c.what} (${label}, got ${run.status})`
  );
  if (!ok) console.log(`        stdout: ${run.stdout?.trim()}\n        stderr: ${run.stderr?.trim()}`);
}

/* Argument handling is part of the trust boundary too. */
for (const [argv, what] of [
  [["--input"], "--input with no value"],
  [["--bogus", "x"], "unrecognised argument"],
]) {
  const run = spawnSync(process.execPath, [SCRIPT, ...argv], { encoding: "utf8" });
  const ok = run.status === 1;
  if (!ok) failed++;
  console.log(`  ${ok ? "ok  " : "FAIL"} args: ${what} (should FAIL CLOSED, got ${run.status})`);
}

rmSync(dir, { recursive: true, force: true });

if (failed) {
  console.error(`\naudit-check tests: ${failed} FAILED`);
  process.exit(1);
}
console.log(`\naudit-check tests: all ${cases.length + 2} passed`);
