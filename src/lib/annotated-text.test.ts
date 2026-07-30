/**
 * Tests for the annotated-prose compiler.
 *
 * This is more logic than a footer year: it is a small parser enforcing several
 * correctness and security invariants, so it gets exercised directly rather than
 * only implicitly via `npm run build`.
 *
 * No test framework, deliberately. `tsx` executes it with the project's own
 * TypeScript semantics, including path aliases, so the test environment matches how
 * the application actually resolves modules.
 *
 *   npm run test:annotations
 */

import {
  compileAnnotatedText,
  defineAnnotatedProse,
  AnnotationError,
  type Annotation,
  type HttpsUrl,
} from "./annotated-text";

let failed = 0;

function expectOk(what: string, text: string, annotations: readonly Annotation[]) {
  try {
    const segments = compileAnnotatedText({ text, annotations });
    /* The invariant that matters most: annotating must never change what a
       visitor reads. Checked here for every valid case as well as inside the
       compiler itself. */
    const rebuilt = segments.map((s) => s.text).join("");
    if (rebuilt !== text) {
      failed++;
      console.log(`  FAIL ${what}: segments do not reconstruct prose`);
      console.log(`       expected: ${JSON.stringify(text)}`);
      console.log(`       got:      ${JSON.stringify(rebuilt)}`);
      return;
    }
    console.log(`  ok   ${what} (reconstructs exactly, ${segments.length} segment(s))`);
  } catch (e) {
    failed++;
    console.log(`  FAIL ${what}: threw unexpectedly -> ${(e as Error).message}`);
  }
}

function expectReject(what: string, text: string, annotations: readonly Annotation[], needle: string) {
  try {
    compileAnnotatedText({ text, annotations });
    failed++;
    console.log(`  FAIL ${what}: compiled when it should have thrown`);
  } catch (e) {
    const err = e as Error;
    if (!(err instanceof AnnotationError)) {
      failed++;
      console.log(`  FAIL ${what}: wrong error type ${err.name}`);
      return;
    }
    if (!err.message.includes(needle)) {
      failed++;
      console.log(`  FAIL ${what}: rejected for the wrong reason -> ${err.message}`);
      return;
    }
    console.log(`  ok   ${what} (rejected: ${needle})`);
  }
}

const HREF = "https://example.com/a" as HttpsUrl;
const PROSE = "alpha beta gamma delta";

/* --- valid --- */
expectOk("plain text, no annotations", PROSE, []);
expectOk("single accent", PROSE, [{ kind: "accent", phrase: "beta", accent: "cyan" }]);
expectOk("single link", PROSE, [{ kind: "link", phrase: "gamma", href: HREF }]);
expectOk("accent and link together", PROSE, [
  { kind: "accent", phrase: "beta", accent: "violetSoft" },
  { kind: "link", phrase: "delta", href: HREF },
]);
expectOk("annotation at the very start", PROSE, [{ kind: "accent", phrase: "alpha", accent: "cyan" }]);
expectOk("annotation at the very end", PROSE, [{ kind: "accent", phrase: "delta", accent: "cyan" }]);
expectOk("whole string annotated", PROSE, [{ kind: "accent", phrase: PROSE, accent: "cyan" }]);
/* Adjacent ranges must remain legal: [0,5) then [5,9). */
expectOk("adjacent ranges", "abcdefghij", [
  { kind: "accent", phrase: "abcde", accent: "cyan" },
  { kind: "accent", phrase: "fghij", accent: "violetSoft" },
]);
/* Authoring order must not matter, since the compiler sorts by source offset. */
expectOk("annotations authored out of source order", PROSE, [
  { kind: "accent", phrase: "delta", accent: "cyan" },
  { kind: "accent", phrase: "alpha", accent: "violetSoft" },
]);

/* --- rejected --- */
expectReject("missing phrase", PROSE, [{ kind: "accent", phrase: "omega", accent: "cyan" }], "does not appear");
expectReject(
  "duplicate phrase",
  "beta and beta again",
  [{ kind: "accent", phrase: "beta", accent: "cyan" }],
  "more than once"
);
expectReject(
  "overlapping ranges",
  PROSE,
  [
    { kind: "accent", phrase: "beta gamma", accent: "cyan" },
    { kind: "accent", phrase: "gamma delta", accent: "violetSoft" },
  ],
  "overlap"
);
expectReject("empty phrase", PROSE, [{ kind: "accent", phrase: "", accent: "cyan" }], "non-whitespace");
expectReject("whitespace-only phrase", PROSE, [{ kind: "accent", phrase: "   ", accent: "cyan" }], "non-whitespace");

/* The template-literal type is compile-time friction, NOT the security boundary.
   These cast past it on purpose, to prove the runtime checks stand alone. */
expectReject(
  "http scheme (type circumvented)",
  PROSE,
  [{ kind: "link", phrase: "beta", href: "http://example.com" as unknown as HttpsUrl }],
  "must use https"
);
expectReject(
  "malformed URL (type circumvented)",
  PROSE,
  [{ kind: "link", phrase: "beta", href: "https://not a url" as HttpsUrl }],
  "not a valid URL"
);
expectReject(
  "credentials in URL",
  PROSE,
  [{ kind: "link", phrase: "beta", href: "https://user:pw@example.com/" as HttpsUrl }],
  "credentials"
);
expectReject(
  "unknown accent (type circumvented)",
  PROSE,
  [{ kind: "accent", phrase: "beta", accent: "neonPink" as unknown as "cyan" }],
  "unknown accent"
);

/* --- the content-boundary helper --- */
try {
  const compiled = defineAnnotatedProse({
    text: PROSE,
    annotations: [{ kind: "link", phrase: "beta", href: HREF }],
  });
  const ok = compiled.text === PROSE && compiled.segments.map((s) => s.text).join("") === PROSE;
  console.log(`  ${ok ? "ok  " : "FAIL"} defineAnnotatedProse returns validated, reconstructing prose`);
  if (!ok) failed++;
} catch (e) {
  failed++;
  console.log(`  FAIL defineAnnotatedProse threw -> ${(e as Error).message}`);
}
try {
  defineAnnotatedProse({ text: PROSE, annotations: [{ kind: "accent", phrase: "nope", accent: "cyan" }] });
  failed++;
  console.log("  FAIL defineAnnotatedProse accepted invalid content");
} catch {
  console.log("  ok   defineAnnotatedProse rejects invalid content at definition time");
}

if (failed) {
  console.error(`\nannotated-text tests: ${failed} FAILED`);
  process.exit(1);
}
console.log("\nannotated-text tests: all passed");
