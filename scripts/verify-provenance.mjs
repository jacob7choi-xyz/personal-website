#!/usr/bin/env node
/**
 * Checks committed binary/licence assets against their recorded provenance.
 *
 * Why this exists separately from the signature check: `verify:signature` proves
 * the CURRENT font plus the CURRENT generator reproduce the CURRENT committed
 * artifact. It would still pass if someone swapped the font and regenerated the
 * signature in the same commit, leaving the provenance record describing a binary
 * that is no longer there. This makes that impossible without an explicit, visible
 * edit to scripts/asset-provenance.json.
 *
 * Scope, stated precisely: this is a LOCK on the reviewed files, not a live check
 * of upstream truth. It proves each committed asset still hashes to the value that
 * was reviewed. It does NOT re-establish that the recorded hash matches the
 * upstream repository; that was done by hand at review time and is written up in
 * GreatVibes-PROVENANCE.md. Offline by design, so it cannot be weakened by network
 * conditions and does not turn every build into a request to a third party.
 *
 * It covers exactly the assets listed in asset-provenance.json. It does not
 * discover new binaries; a newly committed asset must be added deliberately.
 *
 * Fails closed: anything it cannot positively check is an error.
 *
 *   node scripts/verify-provenance.mjs
 */

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const RECORD = join(HERE, "asset-provenance.json");

function fail(message) {
  console.error("verify-provenance: FAIL");
  console.error(`  ${message}`);
  process.exit(1);
}

const extra = process.argv.slice(2);
if (extra.length) fail(`unrecognised argument "${extra[0]}"`);

let doc;
try {
  doc = JSON.parse(readFileSync(RECORD, "utf8"));
} catch (e) {
  fail(`cannot read or parse ${RECORD}: ${e.message}`);
}
if (!doc || !Array.isArray(doc.assets) || doc.assets.length === 0) {
  fail("asset-provenance.json has no `assets` array");
}

const seen = new Set();
for (const [i, a] of doc.assets.entries()) {
  for (const field of ["file", "sha256", "bytes", "upstream", "licence", "reviewed"]) {
    if (a?.[field] === undefined) fail(`asset #${i} is missing \`${field}\``);
  }
  if (!/^[a-f0-9]{64}$/.test(a.sha256)) fail(`asset #${i} has a malformed sha256`);
  if (!Number.isInteger(a.bytes) || a.bytes <= 0) fail(`asset #${i} \`bytes\` must be a positive integer`);
  for (const field of ["licence", "reviewed"]) {
    if (typeof a[field] !== "string" || !a[field].trim()) fail(`asset #${i} \`${field}\` must be non-blank`);
  }
  /* Defensive rather than a live threat, since anyone who can edit this record can
     edit the verifier too. It costs nothing and keeps the record honest. */
  if (typeof a.file !== "string" || isAbsolute(a.file) || a.file.split(/[\\/]/).includes("..")) {
    fail(`asset #${i} has an unsafe file path "${a.file}"`);
  }
  if (seen.has(a.file)) fail(`asset #${i} duplicates an earlier entry for ${a.file}`);
  seen.add(a.file);
  for (const field of ["repository", "commit", "path"]) {
    if (typeof a.upstream?.[field] !== "string" || !a.upstream[field]) {
      fail(`asset #${i} upstream is missing \`${field}\``);
    }
  }
  /* A branch name is not a retrieval point: it can be rewritten, and would then no
     longer return the artifact that was reviewed. */
  if (!/^[a-f0-9]{40}$/.test(a.upstream.commit)) {
    fail(`asset #${i} upstream.commit must be a full 40-character commit SHA, got "${a.upstream.commit}"`);
  }

  const assetPath = resolve(ROOT, a.file);
  const rel = relative(ROOT, assetPath);
  if (rel.startsWith("..") || isAbsolute(rel)) fail(`${a.file} escapes the repository root`);
  let buf;
  try {
    buf = readFileSync(assetPath);
  } catch (e) {
    fail(`${a.file} is recorded but missing or unreadable: ${e.message}`);
  }
  const sha = createHash("sha256").update(buf).digest("hex");
  if (buf.length !== a.bytes) {
    fail(`${a.file} is ${buf.length} bytes, recorded as ${a.bytes}`);
  }
  if (sha !== a.sha256) {
    fail(
      `${a.file} hash mismatch\n    recorded: ${a.sha256}\n    actual:   ${sha}\n` +
        `  If the asset was changed deliberately, update scripts/asset-provenance.json in the same commit ` +
        `and re-establish where the new file came from.`
    );
  }
  /* Derived, never stored, so the record cannot disagree with itself. */
  const url = `https://raw.githubusercontent.com/${a.upstream.repository}/${a.upstream.commit}/${a.upstream.path}`;
  if (a.upstream.url !== undefined) {
    fail(`asset #${i} stores an \`upstream.url\`; it is derived from repository/commit/path and must not be recorded separately`);
  }
  console.log(`  ok  ${a.file} (${a.bytes} bytes, ${a.licence})`);
  console.log(`      reviewed against ${url}`);
}

console.log(`verify-provenance: PASS (${doc.assets.length} asset(s) match their recorded provenance)`);
