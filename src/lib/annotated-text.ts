/**
 * Compiles prose plus annotations into validated segments.
 *
 * Why this exists: the hero bio used to be assembled by substring-replacing
 * phrases with hand-written HTML strings and injecting the result via
 * `dangerouslySetInnerHTML`. That put an HTML-escaping obligation on our own code,
 * interpolated URLs into an href attribute as text, accepted arbitrary CSS colour
 * strings, and turned a mistyped or reworded phrase into a silent visual
 * regression.
 *
 * What this does NOT do, stated honestly: it does not remove the coupling between
 * prose and its annotations. Reword an annotated phrase and its annotation still
 * has to change. What it removes is the SILENCE. The coupling is explicit,
 * co-located with the prose, validated, and fails the build.
 *
 * WHERE validation happens matters. `defineAnnotatedProse` compiles at the point
 * the content is DEFINED, not when a component renders it. So the invariant is
 * "invalid annotated content cannot exist as usable site content", rather than the
 * weaker "invalid content fails if some component happens to render it". Content
 * that is authored but not yet rendered still fails the build, and the guarantee
 * does not quietly depend on the route staying statically prerendered.
 *
 * This module is pure policy: it knows which accent identifiers are legal, but not
 * how the site paints them. That mapping belongs to the rendering layer.
 */

/** Legal accent identifiers. Deliberately NOT their CSS values. */
export type Accent = "cyan" | "violetSoft";

const ACCENT_NAMES: readonly Accent[] = ["cyan", "violetSoft"];

/**
 * Compile-time friction only: it proves a string starts with "https://", not that
 * it is a URL. Every value is still parsed at runtime.
 */
export type HttpsUrl = `https://${string}`;

export type Annotation =
  | { kind: "accent"; phrase: string; accent: Accent }
  | { kind: "link"; phrase: string; href: HttpsUrl };

export type Segment =
  | { kind: "text"; text: string }
  | { kind: "accent"; text: string; accent: Accent }
  | { kind: "link"; text: string; href: HttpsUrl };

export type AnnotatedProse = {
  text: string;
  annotations: readonly Annotation[];
};

/** Prose that has been validated. Renderers only ever see this. */
export type CompiledProse = {
  readonly text: string;
  readonly segments: readonly Segment[];
};

export class AnnotationError extends Error {
  constructor(message: string) {
    super(`Annotated text: ${message}`);
    this.name = "AnnotationError";
  }
}

/**
 * Parse, validate, then return the CANONICAL form. Validating one value and
 * rendering a different one is the pattern worth avoiding, even when they happen
 * to be identical today.
 */
function parseHttpsUrl(href: string, phrase: string): HttpsUrl {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    throw new AnnotationError(`link for "${phrase}" is not a valid URL: ${href}`);
  }
  if (url.protocol !== "https:") {
    throw new AnnotationError(
      `link for "${phrase}" must use https, got "${url.protocol}" in ${href}`
    );
  }
  if (url.username || url.password) {
    throw new AnnotationError(`link for "${phrase}" carries credentials, which is never intended`);
  }
  /* The assertion is justified by the protocol check immediately above: a URL
     whose protocol is https: serialises with an "https://" prefix. */
  return url.href as HttpsUrl;
}

/**
 * Locate each phrase exactly once, reject overlaps, and slice the prose by source
 * offset. The prose is never rewritten, so there is no point at which markup could
 * be constructed and no cascading-offset bug from sequential replacement.
 */
export function compileAnnotatedText(prose: AnnotatedProse): readonly Segment[] {
  const { text, annotations } = prose;

  const located = annotations.map((a) => {
    if (!a.phrase.trim()) {
      throw new AnnotationError("annotation phrase must contain non-whitespace text");
    }
    if (a.kind === "accent" && !ACCENT_NAMES.includes(a.accent)) {
      throw new AnnotationError(`unknown accent "${a.accent}" for phrase "${a.phrase}"`);
    }

    const start = text.indexOf(a.phrase);
    if (start === -1) {
      throw new AnnotationError(
        `phrase "${a.phrase}" does not appear in the prose. If the copy was reworded, update the annotation in the same edit.`
      );
    }
    if (text.indexOf(a.phrase, start + 1) !== -1) {
      throw new AnnotationError(
        `phrase "${a.phrase}" appears more than once; the target would be ambiguous. Use a longer, unique phrase.`
      );
    }

    return a.kind === "link"
      ? { ...a, href: parseHttpsUrl(a.href, a.phrase), start, end: start + a.phrase.length }
      : { ...a, start, end: start + a.phrase.length };
  });

  /* Sorting by offset makes overlap detection one linear scan, and means the
     order annotations are authored in cannot affect rendered placement. Strict
     `<` so adjacent ranges, [0,5) then [5,10), stay legal. */
  const ordered = [...located].sort((x, y) => x.start - y.start);
  for (let i = 1; i < ordered.length; i++) {
    if (ordered[i].start < ordered[i - 1].end) {
      throw new AnnotationError(
        `annotations for "${ordered[i - 1].phrase}" and "${ordered[i].phrase}" overlap. ` +
          `Nested formatting is intentionally unsupported; if it is genuinely needed, model the precedence explicitly.`
      );
    }
  }

  const segments: Segment[] = [];
  let cursor = 0;
  for (const a of ordered) {
    if (a.start > cursor) segments.push({ kind: "text", text: text.slice(cursor, a.start) });
    const slice = text.slice(a.start, a.end);
    segments.push(
      a.kind === "link"
        ? { kind: "link", text: slice, href: a.href }
        : { kind: "accent", text: slice, accent: a.accent }
    );
    cursor = a.end;
  }
  if (cursor < text.length) segments.push({ kind: "text", text: text.slice(cursor) });

  /* The invariant that matters most: annotating must never change what a visitor
     reads. Asserted on every compilation rather than only in tests, so it holds
     for all content, not just the cases someone remembered to cover. */
  const reconstructed = segments.map((s) => s.text).join("");
  if (reconstructed !== text) {
    throw new AnnotationError(
      "internal error: segments do not reconstruct the original prose, which means annotation would alter visible copy"
    );
  }

  return segments;
}

/**
 * Use this at the point content is authored. Compiling here is what makes invalid
 * annotated prose impossible to hold as site content, instead of merely impossible
 * to render.
 */
export function defineAnnotatedProse(prose: AnnotatedProse): CompiledProse {
  return { text: prose.text, segments: compileAnnotatedText(prose) };
}
