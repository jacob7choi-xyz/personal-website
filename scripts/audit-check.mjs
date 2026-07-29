#!/usr/bin/env node
/**
 * Dependency advisory gate. Fails CLOSED.
 *
 * Design notes, because the failure modes here matter more than the line count:
 *
 * 1. `npm audit` exits NONZERO whenever it finds anything. So exit status alone
 *    cannot distinguish "found advisories" from "the tool broke". This script
 *    therefore never gates on npm's exit code. It gates on whether it received
 *    a document that is structurally a real audit report.
 * 2. Anything it cannot positively interpret is a FAILURE. Unreachable registry,
 *    truncated output, unexpected schema, or a thrown parse all fail. Not being
 *    able to determine safety is not the same as being safe.
 * 3. Exceptions are keyed on advisory + package + maximum approved severity +
 *    expiry. A bare advisory ID would let the same GHSA reappear through a
 *    different package, or at a higher severity, and still pass.
 * 4. Exceptions deliberately do NOT bind the installed version or dependency
 *    path. Those churn on ordinary lockfile changes, and a gate that cries wolf
 *    gets rubber-stamped, which is worse than a slightly looser one.
 * 5. `critical` can never be suppressed, allowlisted or not.
 *
 * Usage:
 *   node scripts/audit-check.mjs                 # runs npm audit itself
 *   node scripts/audit-check.mjs --input f.json  # evaluates a fixture
 *
 * Exit: 0 pass, 1 fail (policy violation or indeterminate result).
 */

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ALLOWLIST_PATH = join(HERE, "..", ".github", "audit-allowlist.json");

const RANK = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const NEVER_SUPPRESSIBLE = "critical";

class Indeterminate extends Error {}

function loadAllowlist() {
  let raw;
  try {
    raw = readFileSync(ALLOWLIST_PATH, "utf8");
  } catch (e) {
    throw new Indeterminate(`cannot read allowlist at ${ALLOWLIST_PATH}: ${e.message}`);
  }
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (e) {
    throw new Indeterminate(`allowlist is not valid JSON: ${e.message}`);
  }
  if (!doc || !Array.isArray(doc.exceptions)) {
    throw new Indeterminate("allowlist is missing an `exceptions` array");
  }
  for (const [i, x] of doc.exceptions.entries()) {
    for (const field of ["advisory", "package", "approvedSeverity", "expires", "reason"]) {
      if (typeof x?.[field] !== "string" || !x[field]) {
        throw new Indeterminate(`exception #${i} is missing a valid \`${field}\``);
      }
    }
    if (!(x.approvedSeverity in RANK)) {
      throw new Indeterminate(`exception #${i} has unknown severity "${x.approvedSeverity}"`);
    }
    if (x.approvedSeverity === NEVER_SUPPRESSIBLE) {
      throw new Indeterminate(`exception #${i} approves "critical", which is never suppressible`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(x.expires) || Number.isNaN(Date.parse(x.expires))) {
      throw new Indeterminate(`exception #${i} has an unparseable \`expires\` (${x.expires})`);
    }
  }
  return doc.exceptions;
}

function getAuditDocument(inputPath) {
  if (inputPath) {
    let raw;
    try {
      raw = readFileSync(inputPath, "utf8");
    } catch (e) {
      throw new Indeterminate(`cannot read input: ${e.message}`);
    }
    return parseAudit(raw);
  }
  // Deliberately ignoring `status`: npm audit exits nonzero on findings.
  const run = spawnSync("npm", ["audit", "--json"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (run.error) throw new Indeterminate(`could not execute npm audit: ${run.error.message}`);
  if (!run.stdout || !run.stdout.trim()) {
    throw new Indeterminate(
      `npm audit produced no stdout (stderr: ${(run.stderr || "").trim().slice(0, 300)})`
    );
  }
  return parseAudit(run.stdout);
}

function parseAudit(raw) {
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (e) {
    throw new Indeterminate(`audit output is not valid JSON: ${e.message}`);
  }
  if (doc && doc.error) {
    const detail = doc.error.summary || doc.error.code || JSON.stringify(doc.error);
    throw new Indeterminate(`npm audit reported an error: ${detail}`);
  }
  // Schema assertion. A report that does not look like a report is indeterminate,
  // never "clean".
  if (!doc || typeof doc !== "object") throw new Indeterminate("audit output is not an object");
  if (typeof doc.vulnerabilities !== "object" || doc.vulnerabilities === null) {
    throw new Indeterminate("audit output has no `vulnerabilities` object");
  }
  if (typeof doc.metadata?.vulnerabilities !== "object" || doc.metadata.vulnerabilities === null) {
    throw new Indeterminate("audit output has no `metadata.vulnerabilities` object");
  }
  return doc;
}

/** Collapse npm's per-package view into distinct advisories. */
function extractAdvisories(doc) {
  const found = new Map();
  for (const entry of Object.values(doc.vulnerabilities)) {
    // `via` mixes advisory objects with plain package-name strings (indirect).
    for (const via of entry?.via ?? []) {
      if (!via || typeof via !== "object") continue;
      const id = typeof via.url === "string" ? via.url.split("/").pop() : null;
      if (!id) continue;
      const severity = via.severity;
      if (!(severity in RANK)) {
        throw new Indeterminate(`advisory ${id} has unknown severity "${severity}"`);
      }
      const key = `${id}::${via.name}`;
      const prev = found.get(key);
      if (!prev || RANK[severity] > RANK[prev.severity]) {
        found.set(key, { id, package: via.name, severity, title: via.title ?? "" });
      }
    }
  }
  return [...found.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function evaluate(advisories, exceptions, today) {
  const failures = [];
  const suppressed = [];
  const usedKeys = new Set();

  for (const a of advisories) {
    if (a.severity === NEVER_SUPPRESSIBLE) {
      failures.push(`${a.id} (${a.package}): CRITICAL, never suppressible`);
      continue;
    }
    const match = exceptions.find((x) => x.advisory === a.id && x.package === a.package);
    if (!match) {
      failures.push(`${a.id} (${a.package}, ${a.severity}): no approved exception. ${a.title}`);
      continue;
    }
    usedKeys.add(`${match.advisory}::${match.package}`);
    if (RANK[a.severity] > RANK[match.approvedSeverity]) {
      failures.push(
        `${a.id} (${a.package}): severity is now ${a.severity}, only ${match.approvedSeverity} was approved`
      );
      continue;
    }
    if (Date.parse(match.expires) < today) {
      failures.push(
        `${a.id} (${a.package}): exception expired ${match.expires}, needs re-review`
      );
      continue;
    }
    suppressed.push(`${a.id} (${a.package}, ${a.severity}) until ${match.expires}`);
  }

  // Unused entries are hygiene, not risk: an expired exception has already lost
  // its power to suppress above. Reported, not fatal.
  const stale = exceptions
    .filter((x) => !usedKeys.has(`${x.advisory}::${x.package}`))
    .map((x) => `${x.advisory} (${x.package})`);

  return { failures, suppressed, stale };
}

function main() {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--input");
  const inputPath = i === -1 ? null : argv[i + 1];

  let result;
  try {
    const exceptions = loadAllowlist();
    const doc = getAuditDocument(inputPath);
    const advisories = extractAdvisories(doc);
    result = evaluate(advisories, exceptions, Date.now());
    console.log(`audit-check: ${advisories.length} distinct advisor${advisories.length === 1 ? "y" : "ies"}`);
  } catch (e) {
    if (e instanceof Indeterminate) {
      console.error(`audit-check: FAIL CLOSED, could not determine dependency safety.`);
      console.error(`  ${e.message}`);
      process.exit(1);
    }
    console.error(`audit-check: FAIL CLOSED, unexpected error.`);
    console.error(`  ${e?.stack || e}`);
    process.exit(1);
  }

  for (const s of result.suppressed) console.log(`  accepted: ${s}`);
  for (const s of result.stale) console.log(`  stale exception (no longer reported): ${s}`);
  if (result.failures.length) {
    console.error(`audit-check: FAIL, ${result.failures.length} unapproved finding(s):`);
    for (const f of result.failures) console.error(`  ${f}`);
    console.error(`\nReview SECURITY-AUDIT.md, then either upgrade or record a dated exception.`);
    process.exit(1);
  }
  console.log("audit-check: PASS");
}

main();
