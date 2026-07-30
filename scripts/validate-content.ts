#!/usr/bin/env node
/**
 * Validates the REAL site content ahead of time.
 *
 * Why this exists: annotated prose is validated by `defineAnnotatedProse`, which
 * is ordinary runtime JavaScript. `tsc` never executes it, so "the build validates
 * all authored content" is only true for as long as the build happens to evaluate
 * the module that defines it. That is a dependency on route architecture and on
 * which modules end up in the graph, not a guarantee.
 *
 * This script removes that dependency: it imports the actual content modules
 * directly, forcing every `defineAnnotatedProse` call to run. If any real
 * annotation is invalid, this fails, regardless of whether a component renders it
 * or how the route is rendered.
 *
 * It deliberately does NOT re-test the compiler; `src/lib/annotated-text.test.mts`
 * covers that. This answers a different question: is the copy currently in the
 * repository valid?
 *
 *   npm run validate:content
 *
 * Run by `tsx`, so it resolves the project's own path aliases and imports the very
 * same module specifier the application does. That matters: validating a
 * differently-resolved copy of the content would prove the wrong thing.
 */

import { personalInfo } from "@/constants/socials";

let failed = false;

try {
  /* Deliberately treated as `unknown` and re-checked at runtime. A validator that
     trusts the types it is validating proves nothing: the point is to catch a block
     someone forgot to wrap in defineAnnotatedProse(), which is exactly the case
     where the static type would be a lie. */
  const blocks = Object.entries(personalInfo.bio) as [string, unknown][];
  if (blocks.length === 0) throw new Error("personalInfo.bio has no annotated blocks");

  for (const [name, value] of blocks) {
    if (value === null || typeof value !== "object") {
      throw new Error(`bio.${name} is not an object`);
    }
    const block = value as { text?: unknown; segments?: unknown };
    if (typeof block.text !== "string" || !Array.isArray(block.segments)) {
      throw new Error(`bio.${name} is not compiled prose; wrap it in defineAnnotatedProse()`);
    }
    const segments = block.segments as { kind?: unknown; text?: unknown }[];
    if (segments.some((s) => typeof s?.text !== "string" || typeof s?.kind !== "string")) {
      throw new Error(`bio.${name} contains a malformed segment`);
    }
    const rebuilt = segments.map((s) => s.text as string).join("");
    if (rebuilt !== block.text) {
      throw new Error(`bio.${name}: segments do not reconstruct the prose`);
    }
    const links = segments.filter((s) => s.kind === "link").length;
    const accents = segments.filter((s) => s.kind === "accent").length;
    console.log(
      `  ok  bio.${name}: ${segments.length} segment(s), ${links} link(s), ${accents} accent(s), prose intact`
    );
  }
} catch (e) {
  failed = true;
  console.error("validate-content: FAIL");
  console.error(`  ${e instanceof Error ? e.message : String(e)}`);
}

if (failed) process.exit(1);
console.log("validate-content: PASS (real site copy is valid)");
