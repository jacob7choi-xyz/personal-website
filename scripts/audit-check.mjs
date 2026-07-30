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
 * 3. The parsed advisory list is cross-checked against `metadata.vulnerabilities`
 *    so parser drift cannot hide findings npm is itself reporting. This is NOT
 *    oracle independence: both views come from the same audit document, produced
 *    by the same npm process from the same registry data. The registry stays a
 *    single external trust boundary.
 * 4. An exception is IDENTIFIED by advisory + package (one policy record per
 *    GHSA/package, which is why duplicates are rejected). Maximum approved
 *    severity and exclusive expiry are CONSTRAINTS on that record, not part of
 *    its identity. A bare advisory ID would let the same GHSA reappear through a
 *    different package and still pass.
 * 5. Exceptions deliberately do NOT bind installed version or dependency path.
 *    Those churn on ordinary lockfile changes, and a gate that cries wolf gets
 *    rubber-stamped.
 * 6. An UNUSED exception is fatal, not hygiene. An unused but unexpired entry is
 *    dormant suppression authority: if a dependency change reintroduces the
 *    advisory, it would be suppressed again with no human re-review. The
 *    allowlist must be an exact representation of currently accepted risk.
 * 7. `critical` can never be suppressed, allowlisted or not.
 * 8. `expires` is EXCLUSIVE: an exception stops suppressing at 00:00 UTC on that
 *    date, so the date itself is the first day it no longer applies. It must also
 *    be a real calendar date, because JS normalises impossible days silently.
 * 9. The `via` data is a GRAPH. Every reported package must resolve to an advisory
 *    object, not merely point at another known entry.
 * 10. Test overrides (`--now`, a custom `--allowlist`) are only accepted with
 *    `--input`. A comment saying "test-only" is not enforcement.
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

/**
 * Every failure carries a stable machine code. The fixture suite asserts the
 * code, not just a nonzero exit, so a test cannot pass because the wrong control
 * fired. Codes are internal; the prose is free to change.
 */
class Indeterminate extends Error {
  constructor(code, message) {
    super(`[${code}] ${message}`);
    this.code = code;
  }
}

/* ------------------------------------------------------------------ args */

function parseArgs(argv) {
  const FLAGS = { "--input": "input", "--allowlist": "allowlist", "--now": "now" };
  const out = { input: null, allowlist: DEFAULT_ALLOWLIST, now: null };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (!(flag in FLAGS)) throw new Indeterminate("E_ARGS", `unrecognised argument "${flag}"`);
    const value = argv[i + 1];
    if (typeof value !== "string" || value.startsWith("--")) {
      throw new Indeterminate("E_ARGS", `${flag} requires a value`);
    }
    out[FLAGS[flag]] = value;
    i++;
  }
  if (out.now !== null) {
    const ms = Date.parse(out.now);
    if (!Number.isFinite(ms)) throw new Indeterminate("E_ARGS", `--now is not a valid timestamp`);
    out.now = ms;
  }
  /* Fixture-mode coupling. Calling these "test-only" in a comment is not
     enforcement: without this, `audit-check.mjs --now 2020-01-01` would run the
     REAL npm audit and evaluate live findings under fictional policy time, making
     an expired exception look valid. Overrides are therefore only accepted
     alongside --input, so production mode is always: live audit + real clock +
     canonical allowlist. */
  if ((out.now !== null || out.allowlist !== DEFAULT_ALLOWLIST) && out.input === null) {
    throw new Indeterminate(
      "E_ARGS",
      "--now and a custom --allowlist are only valid with --input (fixture mode); " +
        "a live audit must be evaluated against the real clock and the canonical allowlist"
    );
  }
  return out;
}

/* ------------------------------------------------------------- allowlist */

function loadAllowlist(path) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch (e) {
    throw new Indeterminate("E_ALLOWLIST_READ", `cannot read allowlist at ${path}: ${e.message}`);
  }
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (e) {
    throw new Indeterminate("E_ALLOWLIST_JSON", `allowlist is not valid JSON: ${e.message}`);
  }
  if (!doc || typeof doc !== "object" || !Array.isArray(doc.exceptions)) {
    throw new Indeterminate("E_ALLOWLIST_SHAPE", "allowlist is missing an `exceptions` array");
  }

  const seen = new Set();
  for (const [i, x] of doc.exceptions.entries()) {
    for (const field of ["advisory", "package", "approvedSeverity", "expires", "reason"]) {
      if (typeof x?.[field] !== "string" || !x[field]) {
        throw new Indeterminate("E_ALLOWLIST_FIELD", `exception #${i} is missing a valid \`${field}\``);
      }
    }
    if (!(x.approvedSeverity in RANK)) {
      throw new Indeterminate(
        "E_ALLOWLIST_SEVERITY",
        `exception #${i} has unknown severity "${x.approvedSeverity}"`
      );
    }
    if (x.approvedSeverity === NEVER_SUPPRESSIBLE) {
      throw new Indeterminate(
        "E_ALLOWLIST_CRITICAL",
        `exception #${i} approves "critical", which is never suppressible`
      );
    }
    expiryMs(x.expires, i); // throws E_ALLOWLIST_DATE on anything not a real calendar date
    // Duplicates would make policy order-dependent via the lookup below.
    const key = exceptionKey(x);
    if (seen.has(key)) {
      throw new Indeterminate(
        "E_ALLOWLIST_DUPLICATE",
        `allowlist has duplicate entries for ${x.advisory} / ${x.package}`
      );
    }
    seen.add(key);
  }
  return doc.exceptions;
}

const exceptionKey = (x) => `${x.advisory}::${x.package}`;

/**
 * Exclusive expiry: valid while now < the returned instant.
 *
 * The regex and a NaN check are NOT sufficient. JavaScript silently normalises
 * impossible days in this format rather than rejecting them, verified:
 *   2026-02-31 -> 2026-03-03
 *   2026-02-29 -> 2026-03-01   (2026 is not a leap year)
 *   2026-04-31 -> 2026-05-01
 * So a reviewer could write one date and the policy would silently use another.
 * Round-tripping the parsed value back to a string is what makes the calendar
 * date real, independent of engine behaviour.
 */
function expiryMs(isoDate, index) {
  const where = index === undefined ? "" : `exception #${index} `;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    throw new Indeterminate(
      "E_ALLOWLIST_DATE",
      `${where}\`expires\` must be YYYY-MM-DD (got "${isoDate}")`
    );
  }
  const ms = Date.parse(`${isoDate}T00:00:00Z`);
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 10) !== isoDate) {
    throw new Indeterminate(
      "E_ALLOWLIST_DATE",
      `${where}\`expires\` is not a real calendar date (${isoDate})`
    );
  }
  return ms;
}

/* ----------------------------------------------------------------- input */

function getAuditDocument(inputPath) {
  if (inputPath) {
    let raw;
    try {
      raw = readFileSync(inputPath, "utf8");
    } catch (e) {
      throw new Indeterminate("E_AUDIT_READ", `cannot read input: ${e.message}`);
    }
    return parseAudit(raw);
  }
  // Deliberately ignoring `status`: npm audit exits nonzero on findings.
  const run = spawnSync("npm", ["audit", "--json"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (run.error) throw new Indeterminate("E_AUDIT_EXEC", `could not execute npm audit: ${run.error.message}`);
  /* A killed scanner that happened to flush parseable JSON is not a completed
     scan. spawnSync hands us this for free, so distinguish abnormal termination
     from the expected nonzero exit that findings produce. */
  if (run.signal !== null && run.signal !== undefined) {
    throw new Indeterminate("E_AUDIT_EXEC", `npm audit terminated by signal ${run.signal}`);
  }
  if (!run.stdout || !run.stdout.trim()) {
    throw new Indeterminate(
      "E_AUDIT_EMPTY",
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
    throw new Indeterminate("E_AUDIT_JSON", `audit output is not valid JSON: ${e.message}`);
  }
  if (!doc || typeof doc !== "object") throw new Indeterminate("E_AUDIT_SCHEMA", "audit output is not an object");
  if (doc.error) {
    const detail = doc.error.summary || doc.error.code || JSON.stringify(doc.error);
    throw new Indeterminate("E_AUDIT_ERROR", `npm audit reported an error: ${detail}`);
  }
  if (typeof doc.vulnerabilities !== "object" || doc.vulnerabilities === null) {
    throw new Indeterminate("E_AUDIT_SCHEMA", "audit output has no `vulnerabilities` object");
  }
  const counters = doc.metadata?.vulnerabilities;
  if (typeof counters !== "object" || counters === null) {
    throw new Indeterminate("E_AUDIT_SCHEMA", "audit output has no `metadata.vulnerabilities` object");
  }
  for (const c of COUNTERS) {
    const v = counters[c];
    if (!Number.isInteger(v) || v < 0) {
      throw new Indeterminate(
        "E_AUDIT_COUNTER",
        `metadata.vulnerabilities.${c} is not a non-negative integer (${v})`
      );
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
      throw new Indeterminate("E_AUDIT_SCHEMA", `vulnerabilities["${pkg}"] is not an object`);
    }
    if (!Array.isArray(entry.via)) {
      throw new Indeterminate("E_AUDIT_SCHEMA", `vulnerabilities["${pkg}"].via is not an array`);
    }
    for (const via of entry.via) {
      if (typeof via === "string") {
        // Known category: a meta-vulnerability edge naming another vulnerable
        // package. Recognising it as a string is not the same as understanding
        // it, so prove the edge actually resolves. Verified against real output:
        // all 20 string references resolved, so this is not over-strict.
        if (!Object.prototype.hasOwnProperty.call(doc.vulnerabilities, via)) {
          throw new Indeterminate(
            "E_AUDIT_VIA_REF",
            `"${pkg}" references unknown vulnerability package "${via}"`
          );
        }
        continue;
      }
      if (!via || typeof via !== "object") {
        throw new Indeterminate("E_AUDIT_ADVISORY_SHAPE", `vulnerabilities["${pkg}"].via contains an unsupported entry`);
      }
      if (typeof via.url !== "string" || !via.url) {
        throw new Indeterminate(
          "E_AUDIT_ADVISORY_SHAPE",
          `advisory object under "${pkg}" has no \`url\`; audit schema may have changed`
        );
      }
      const id = via.url.split("/").filter(Boolean).pop();
      if (!id) {
        throw new Indeterminate("E_AUDIT_ADVISORY_SHAPE", `advisory under "${pkg}" has an unusable url "${via.url}"`);
      }
      if (typeof via.name !== "string" || !via.name) {
        throw new Indeterminate("E_AUDIT_ADVISORY_SHAPE", `advisory ${id} has no \`name\``);
      }
      if (!(via.severity in RANK)) {
        throw new Indeterminate("E_AUDIT_SEVERITY", `advisory ${id} has unknown severity "${via.severity}"`);
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
 * npm's `via` data is a GRAPH, not a list: a vulnerable package can be explained
 * either by a direct advisory object or by an edge to another vulnerable package
 * (a meta-vulnerability). Verifying that a string edge merely POINTS at a known
 * entry is not the same as understanding it.
 *
 * Counterexample this rules out: A -> B, B -> A with no advisory object anywhere
 * in that component, alongside an unrelated C -> real advisory. Every reference
 * exists, the aggregate counters are consistent, and the component is still
 * unexplained. Under the old checks that combination passed.
 *
 * Requirement: every reported vulnerable package must reach at least one advisory
 * object. Implemented as a monotone fixpoint rather than DFS, which handles cycles
 * without the "memoised a negative computed mid-cycle" trap: a pure cycle with no
 * advisory object never enters the resolved set, so it is reported.
 *
 * Verified against real output before shipping: all 16 entries resolve over 5
 * advisory-object edges and 20 string edges, so this is not over-strict.
 */
function assertViaGraphResolves(doc) {
  const V = doc.vulnerabilities;
  const packages = Object.keys(V);
  const resolved = new Set();

  for (const pkg of packages) {
    if ((V[pkg].via ?? []).some((v) => v && typeof v === "object")) resolved.add(pkg);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const pkg of packages) {
      if (resolved.has(pkg)) continue;
      for (const via of V[pkg].via ?? []) {
        if (typeof via === "string" && resolved.has(via)) {
          resolved.add(pkg);
          changed = true;
          break;
        }
      }
    }
  }

  const unresolved = packages.filter((p) => !resolved.has(p));
  if (unresolved.length) {
    throw new Indeterminate(
      "E_AUDIT_VIA_GRAPH",
      `${unresolved.length} reported vulnerable package(s) never resolve to an advisory object ` +
        `(${unresolved.slice(0, 5).join(", ")}); the meta-vulnerability graph is not fully understood`
    );
  }
}

/**
 * Cross-check the parsed advisories against npm's own aggregate counters.
 *
 * NOT an independent oracle: both views come from the same `npm audit` document,
 * produced by the same npm process from the same registry data. This catches the
 * parser misunderstanding one representation. It does NOT defend against npm
 * emitting internally consistent but wrong data, nor against registry compromise
 * or an omitted upstream advisory. The registry remains a single external trust
 * boundary (see SECURITY-AUDIT.md).
 */
function crossCheck(doc, advisories) {
  const { total, critical } = doc.metadata.vulnerabilities;
  if (total > 0 && advisories.length === 0) {
    throw new Indeterminate(
      "E_ORACLE_MISMATCH",
      `npm reports ${total} vulnerable package(s) but no advisory objects were understood`
    );
  }
  if (total === 0 && advisories.length > 0) {
    throw new Indeterminate(
      "E_ORACLE_MISMATCH",
      `npm reports 0 vulnerabilities but ${advisories.length} advisory object(s) were parsed`
    );
  }
  // Holds regardless of whether the corresponding advisory could be extracted.
  if (critical > 0) {
    return [`[E_CRITICAL] npm reports ${critical} CRITICAL vulnerability(ies); never suppressible`];
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
      failures.push(`[E_CRITICAL] ${a.id} (${a.package}): CRITICAL, never suppressible`);
      continue;
    }
    const match = exceptions.find((x) => x.advisory === a.id && x.package === a.package);
    if (!match) {
      failures.push(`[E_UNAPPROVED] ${a.id} (${a.package}, ${a.severity}): no approved exception. ${a.title}`);
      continue;
    }
    usedKeys.add(exceptionKey(match));
    if (RANK[a.severity] > RANK[match.approvedSeverity]) {
      failures.push(
        `[E_SEVERITY_EXCEEDED] ${a.id} (${a.package}): severity is now ${a.severity}, only ${match.approvedSeverity} was approved`
      );
      continue;
    }
    if (now >= expiryMs(match.expires)) {
      failures.push(
        `[E_EXPIRED] ${a.id} (${a.package}): exception expired ${match.expires}, needs re-review`
      );
      continue;
    }
    suppressed.push(`${a.id} (${a.package}, ${a.severity}) until ${match.expires}`);
  }

  // Dormant suppression authority, not hygiene. See note 6 at the top.
  for (const x of exceptions) {
    if (!usedKeys.has(exceptionKey(x))) {
      failures.push(
        `[E_UNUSED] ${x.advisory} (${x.package}): exception is no longer reported. Remove it; leaving it would silently suppress a future reintroduction`
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
    const { input, allowlist, now } = parseArgs(process.argv.slice(2));
    const exceptions = loadAllowlist(allowlist);
    const doc = getAuditDocument(input);
    const advisories = extractAdvisories(doc);
    count = advisories.length;
    assertViaGraphResolves(doc);
    const oracleFailures = crossCheck(doc, advisories);
    result = evaluate(advisories, exceptions, now ?? Date.now());
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
