/**
 * Compiles prose plus annotations into validated segments.
 *
 * Why this exists: the hero bio used to be assembled by substring-replacing
 * phrases with hand-written HTML strings and injecting the result via
 * `dangerouslySetInnerHTML`. That put an HTML-escaping obligation on our own code,
 * accepted arbitrary CSS colour strings, interpolated URLs into an href attribute
 * as text, and turned a mistyped phrase into a silent visual regression.
 *
 * What changes, stated honestly: this does NOT remove the coupling between prose
 * and its annotations. Reword an annotated phrase and its annotation still has to
 * change. What it removes is the SILENCE. The coupling is now explicit,
 * co-located, validated, and fails the build instead of quietly dropping a link.
 *
 * This module is deliberately pure: it validates and returns data. Rendering is
 * somebody else's job, so correctness policy does not live inside JSX.
 */

/* Closed vocabulary. An annotation can never carry an arbitrary CSS value. */
export const ACCENTS = {
  cyan: "var(--cyan)",
  violetSoft: "var(--violet-soft)",
} as const;

export type Accent = keyof typeof ACCENTS;

export type Annotation =
  | { kind: "accent"; phrase: string; accent: Accent }
  | { kind: "link"; phrase: string; href: `https://${string}` };

export type Segment =
  | { kind: "text"; text: string }
  | { kind: "accent"; text: string; accent: Accent }
  | { kind: "link"; text: string; href: string };

export type AnnotatedProse = {
  text: string;
  annotations: readonly Annotation[];
};

class AnnotationError extends Error {
  constructor(message: string) {
    super(`Annotated text: ${message}`);
  }
}

/**
 * The template-literal type on `href` is compile-time friction only: it proves a
 * string starts with "https://", not that it is a URL. So parse it for real.
 */
function assertHttpsUrl(href: string, phrase: string): void {
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
}

/**
 * Locate each phrase exactly once, reject overlaps, and slice the prose into
 * segments by source offset. The prose string is never rewritten, so there is no
 * point at which markup could be constructed.
 *
 * Throws on any inconsistency. The route is statically prerendered, so an invalid
 * annotation fails `npm run build` rather than shipping a missing link.
 */
export function compileAnnotatedText(prose: AnnotatedProse): readonly Segment[] {
  const { text, annotations } = prose;

  const located = annotations.map((a) => {
    if (!a.phrase) throw new AnnotationError("annotation has an empty phrase");

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
    if (a.kind === "link") assertHttpsUrl(a.href, a.phrase);

    return { ...a, start, end: start + a.phrase.length };
  });

  /* Sorting by offset makes overlap detection a single linear scan. Strict `<`
     so that adjacent ranges, [0,5) then [5,10), remain legal. */
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

  return segments;
}
