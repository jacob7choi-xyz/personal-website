#!/usr/bin/env node
/**
 * Dependency advisory gate. Fails CLOSED.
 *
 * Design notes, because the failure modes here matter more than the line count:
 *
 * 1. `npm audit` exits NONZERO whenever it finds anything, so exit status cannot
 *    distinguish "found advisories" from "the tool broke". This never gates on
 *    npm's exit code. It gates on whether it received a document it fully
 *    understands.
 * 2. Anything it cannot positively interpret is a FAILURE, including an advisory
 *    object whose shape it does not recognise. A security gate must never turn
 *    "I did not understand that input" into PASS. There is deliberately no
 *    silent `continue` over unrecognised objects.
 * 3. Two independent oracles. The advisory list is cross-checked against
 *    `metadata.vulnerabilities`, so parser drift cannot hide findings that npm
 *    itself is reporting.
 * 4. Exceptions are keyed on advisory + package + maximum approved severity +
 *    expiry. A bare advisory ID would let the same GHSA reappear through a
 *    different package, or at a higher severity, and still pass.
 * 5. Exceptions deliberately do NOT bind installed version or dependency path.
 *    Those churn on ordinary lockfile changes, and a gate that cries wolf gets
 *    rubber-stamped.
 * 6. An UNUSED exception is fatal, not hygiene. An unused but unexpired entry is
 *    dormant suppression authority: if a dependency change reintroduces the
 *    advisory, it would be suppressed again with no human re-review. The
 *    allowlist must be an exact representation of currently accepted risk.
 * 7. `critical` can never be suppressed, allowlisted or not.
 * 8. `expires` is EXCLUSIVE: an exception stops suppressing at 00:00 UTC on that
 *    date, so the date itself is the first day it no longer applies.
 *
 * Usage:
 *   node scripts/audit-check.mjs
 *   node scripts/audit-check.mjs --input audit.json --allowlist list.json
 *
 * Exit: 0 pass, 1 fail (policy violation or indeterminate result).
 */

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ALLOWLIST = join(HERE, "..", ".github", "audit-allowlist.json");

const RANK = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const COUNTERS = ["info", "low", "moderate", "high", "critical", "total"];
const NEVER_SUPPRESSIBLE = "critical";

class Indeterminate extends Error {}

/* ------------------------------------------------------------------ args */

function parseArgs(argv) {
  const out = { input: null, allowlist: DEFAULT_ALLOWLIST };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag !== "--input" && flag !== "--allowlist") {
      throw new Indeterminate(`unrecognised argument "${flag}"`);
    }
    const value = argv[i + 1];
    if (typeof value !== "string" || value.startsWith("--")) {
      throw new Indeterminate(`${flag} requires a path`);
    }
    out[flag === "--input" ? "input" : "allowlist"] = value;
    i++;
  }
  return out;
}

/* ------------------------------------------------------------- allowlist */

function loadAllowlist(path) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch (e) {
    throw new Indeterminate(`cannot read allowlist at ${path}: ${e.message}`);
  }
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (e) {
    throw new Indeterminate(`allowlist is not valid JSON: ${e.message}`);
  }
  if (!doc || typeof doc !== "object" || !Array.isArray(doc.exceptions)) {
    throw new Indeterminate("allowlist is missing an `exceptions` array");
  }

  const seen = new Set();
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(x.expires)) {
      throw new Indeterminate(`exception #${i} \`expires\` must be YYYY-MM-DD (got "${x.expires}")`);
    }
    if (Number.isNaN(expiryMs(x.expires))) {
      throw new Indeterminate(`exception #${i} has an unparseable \`expires\` (${x.expires})`);
    }
    // Duplicates would make policy order-dependent via the lookup below.
    const key = exceptionKey(x);
    if (seen.has(key)) {
      throw new Indeterminate(`allowlist has duplicate entries for ${x.advisory} / ${x.package}`);
    }
    seen.add(key);
  }
  return doc.exceptions;
}

const exceptionKey = (x) => `${x.advisory}::${x.package}`;
/** Exclusive: valid while now < this instant. */
const expiryMs = (isoDate) => Date.parse(`${isoDate}T00:00:00Z`);

/* ----------------------------------------------------------------- input */

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
  if (!doc || typeof doc !== "object") throw new Indeterminate("audit output is not an object");
  if (doc.error) {
    const detail = doc.error.summary || doc.error.code || JSON.stringify(doc.error);
    throw new Indeterminate(`npm audit reported an error: ${detail}`);
  }
  if (typeof doc.vulnerabilities !== "object" || doc.vulnerabilities === null) {
    throw new Indeterminate("audit output has no `vulnerabilities` object");
  }
  const counters = doc.metadata?.vulnerabilities;
  if (typeof counters !== "object" || counters === null) {
    throw new Indeterminate("audit output has no `metadata.vulnerabilities` object");
  }
  for (const c of COUNTERS) {
    const v = counters[c];
    if (!Number.isInteger(v) || v < 0) {
      throw new Indeterminate(`metadata.vulnerabilities.${c} is not a non-negative integer (${v})`);
    }
  }
  return doc;
}

/**
 * Collapse npm's per-package view into distinct advisories.
 *
 * `via` mixes advisory OBJECTS with plain package-name STRINGS (the latter
 * express meta-vulnerability relationships and are a known, supported case).
 * Every object, however, must match the shape we understand or the whole result
 * is indeterminate. Skipping an object we cannot read is how a gate silently
 * fails open.
 */
function extractAdvisories(doc) {
  const found = new Map();
  for (const [pkg, entry] of Object.entries(doc.vulnerabilities)) {
    if (!entry || typeof entry !== "object") {
      throw new Indeterminate(`vulnerabilities["${pkg}"] is not an object`);
    }
    if (!Array.isArray(entry.via)) {
      throw new Indeterminate(`vulnerabilities["${pkg}"].via is not an array`);
    }
    for (const via of entry.via) {
      if (typeof via === "string") continue; // known: indirect reference
      if (!via || typeof via !== "object") {
        throw new Indeterminate(`vulnerabilities["${pkg}"].via contains an unsupported entry`);
      }
      if (typeof via.url !== "string" || !via.url) {
        throw new Indeterminate(
          `advisory object under "${pkg}" has no \`url\`; audit schema may have changed`
        );
      }
      const id = via.url.split("/").filter(Boolean).pop();
      if (!id) {
        throw new Indeterminate(`advisory under "${pkg}" has an unusable url "${via.url}"`);
      }
      if (typeof via.name !== "string" || !via.name) {
        throw new Indeterminate(`advisory ${id} has no \`name\``);
      }
      if (!(via.severity in RANK)) {
        throw new Indeterminate(`advisory ${id} has unknown severity "${via.severity}"`);
      }
      const key = `${id}::${via.name}`;
      const prev = found.get(key);
      if (!prev || RANK[via.severity] > RANK[prev.severity]) {
        found.set(key, { id, package: via.name, severity: via.severity, title: via.title ?? "" });
      }
    }
  }
  return [...found.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Second, independent oracle. npm's own counters must not contradict what the
 * parser managed to read.
 */
function crossCheck(doc, advisories) {
  const { total, critical } = doc.metadata.vulnerabilities;
  if (total > 0 && advisories.length === 0) {
    throw new Indeterminate(
      `npm reports ${total} vulnerable package(s) but no advisory objects were understood`
    );
  }
  if (total === 0 && advisories.length > 0) {
    throw new Indeterminate(
      `npm reports 0 vulnerabilities but ${advisories.length} advisory object(s) were parsed`
    );
  }
  // Holds regardless of whether the corresponding advisory could be extracted.
  if (critical > 0) {
    return [`npm reports ${critical} CRITICAL vulnerability(ies); never suppressible`];
  }
  return [];
}

/* ------------------------------------------------------------- evaluation */

function evaluate(advisories, exceptions, now) {
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
    usedKeys.add(exceptionKey(match));
    if (RANK[a.severity] > RANK[match.approvedSeverity]) {
      failures.push(
        `${a.id} (${a.package}): severity is now ${a.severity}, only ${match.approvedSeverity} was approved`
      );
      continue;
    }
    if (now >= expiryMs(match.expires)) {
      failures.push(`${a.id} (${a.package}): exception expired ${match.expires}, needs re-review`);
      continue;
    }
    suppressed.push(`${a.id} (${a.package}, ${a.severity}) until ${match.expires}`);
  }

  // Dormant suppression authority, not hygiene. See note 6 at the top.
  for (const x of exceptions) {
    if (!usedKeys.has(exceptionKey(x))) {
      failures.push(
        `${x.advisory} (${x.package}): exception is no longer reported. Remove it; leaving it would silently suppress a future reintroduction`
      );
    }
  }

  return { failures, suppressed };
}

/* ------------------------------------------------------------------- main */

function main() {
  let result;
  let count = 0;
  try {
    const { input, allowlist } = parseArgs(process.argv.slice(2));
    const exceptions = loadAllowlist(allowlist);
    const doc = getAuditDocument(input);
    const advisories = extractAdvisories(doc);
    count = advisories.length;
    const oracleFailures = crossCheck(doc, advisories);
    result = evaluate(advisories, exceptions, Date.now());
    result.failures.unshift(...oracleFailures);
  } catch (e) {
    if (e instanceof Indeterminate) {
      console.error("audit-check: FAIL CLOSED, could not determine dependency safety.");
      console.error(`  ${e.message}`);
      process.exit(1);
    }
    console.error("audit-check: FAIL CLOSED, unexpected error.");
    console.error(`  ${e?.stack || e}`);
    process.exit(1);
  }

  console.log(`audit-check: ${count} distinct advisor${count === 1 ? "y" : "ies"}`);
  for (const s of result.suppressed) console.log(`  accepted: ${s}`);
  if (result.failures.length) {
    console.error(`audit-check: FAIL, ${result.failures.length} finding(s):`);
    for (const f of result.failures) console.error(`  ${f}`);
    console.error("\nReview SECURITY-AUDIT.md, then upgrade, remove the stale entry, or record a dated exception.");
    process.exit(1);
  }
  console.log("audit-check: PASS");
}

main();
