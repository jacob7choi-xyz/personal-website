#!/usr/bin/env node
/**
 * Deterministic fixture tests for the advisory gate.
 *
 * This exists because audit-check.mjs is a custom security decision engine, and
 * an allowlist that fails open is worse than no allowlist: it produces a green
 * check that looks authoritative. Every case below is a way the gate could
 * wrongly pass.
 *
 * No test framework on purpose. Fixtures are written to a temp dir, the real
 * script is invoked as a subprocess, and only its exit code is asserted.
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

/** Build an npm-audit-shaped document from a list of advisories. */
const report = (advisories) => ({
  auditReportVersion: 2,
  vulnerabilities: Object.fromEntries(
    advisories.map((a) => [
      a.name,
      {
        name: a.name,
        severity: a.severity,
        via: [
          {
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
    vulnerabilities: { info: 0, low: 0, moderate: 0, high: advisories.length, critical: 0, total: advisories.length },
  },
});

/* An advisory that IS in .github/audit-allowlist.json at high, unexpired. */
const APPROVED = { id: "GHSA-r28c-9q8g-f849", name: "postcss", severity: "high" };

const cases = [
  {
    n: 1,
    what: "valid JSON, only approved advisories",
    expect: 0,
    body: JSON.stringify(report([APPROVED])),
  },
  {
    n: 2,
    what: "valid JSON, a NEW unapproved advisory",
    expect: 1,
    body: JSON.stringify(report([{ id: "GHSA-0000-new0-0000", name: "left-pad", severity: "high" }])),
  },
  {
    n: 3,
    what: "approved advisory whose severity now EXCEEDS what was approved",
    expect: 1,
    body: JSON.stringify(
      report([{ id: "GHSA-qx2v-qp2m-jg93", name: "postcss", severity: "high" }]) // approved only at moderate
    ),
  },
  {
    n: 4,
    what: "approved advisory reported through a DIFFERENT package",
    expect: 1,
    body: JSON.stringify(report([{ id: "GHSA-r28c-9q8g-f849", name: "some-other-pkg", severity: "high" }])),
  },
  {
    n: 5,
    what: "critical advisory, even though its ID is allowlisted",
    expect: 1,
    body: JSON.stringify(report([{ ...APPROVED, severity: "critical" }])),
  },
  {
    n: 6,
    what: "clean report, no findings at all",
    expect: 0,
    body: JSON.stringify(report([])),
  },
  {
    n: 7,
    what: "registry/network failure shape (error key present)",
    expect: 1,
    body: JSON.stringify({ error: { code: "ENOTFOUND", summary: "registry unreachable" } }),
  },
  {
    n: 8,
    what: "truncated / invalid JSON",
    expect: 1,
    body: '{"vulnerabilities": {"postcss": ',
  },
  {
    n: 9,
    what: "unexpected schema (no vulnerabilities key)",
    expect: 1,
    body: JSON.stringify({ auditReportVersion: 2, somethingElse: true }),
  },
  {
    n: 10,
    what: "valid JSON but metadata block missing",
    expect: 1,
    body: JSON.stringify({ vulnerabilities: {} }),
  },
  {
    n: 11,
    what: "advisory with an unrecognised severity value",
    expect: 1,
    body: JSON.stringify(report([{ ...APPROVED, severity: "spicy" }])),
  },
  {
    n: 12,
    what: "empty stdout / empty file",
    expect: 1,
    body: "",
  },
];

let failed = 0;
for (const c of cases) {
  const f = join(dir, `case-${c.n}.json`);
  writeFileSync(f, c.body);
  const run = spawnSync(process.execPath, [SCRIPT, "--input", f], { encoding: "utf8" });
  const ok = run.status === c.expect;
  if (!ok) failed++;
  const verdict = ok ? "ok  " : "FAIL";
  const label = c.expect === 0 ? "should PASS" : "should FAIL CLOSED";
  console.log(`  ${verdict} case ${String(c.n).padStart(2)}: ${c.what} (${label}, got exit ${run.status})`);
  if (!ok) console.log(`        stdout: ${run.stdout?.trim()}\n        stderr: ${run.stderr?.trim()}`);
}

rmSync(dir, { recursive: true, force: true });

if (failed) {
  console.error(`\naudit-check tests: ${failed} of ${cases.length} FAILED`);
  process.exit(1);
}
console.log(`\naudit-check tests: all ${cases.length} passed`);
