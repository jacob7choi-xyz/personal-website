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
 * Offline by design. It hashes what is committed and compares against the recorded
 * value; it does not fetch upstream, so it cannot be weakened by network
 * conditions and does not turn every build into a request to a third party. The
 * recorded `upstream.url` is pinned to an immutable commit for humans re-verifying
 * by hand.
 *
 * Fails closed: anything it cannot positively check is an error.
 *
 *   node scripts/verify-provenance.mjs
 */

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

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

for (const [i, a] of doc.assets.entries()) {
  for (const field of ["file", "sha256", "bytes", "upstream", "licence", "reviewed"]) {
    if (a?.[field] === undefined) fail(`asset #${i} is missing \`${field}\``);
  }
  if (!/^[a-f0-9]{64}$/.test(a.sha256)) fail(`asset #${i} has a malformed sha256`);
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

  const path = resolve(ROOT, a.file);
  let buf;
  try {
    buf = readFileSync(path);
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
  console.log(`  ok  ${a.file} (${a.bytes} bytes, ${a.licence}, ${a.upstream.repository}@${a.upstream.commit.slice(0, 7)})`);
}

console.log(`verify-provenance: PASS (${doc.assets.length} asset(s) match their recorded provenance)`);
