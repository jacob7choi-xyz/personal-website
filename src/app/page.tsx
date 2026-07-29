import HomeContent from "./HomeContent";

/* Server component on purpose. The page content needs client hooks (Framer
   Motion, useReducedMotion), but the footer year must not freeze in the
   prerendered HTML. Computing it here and passing it down means the server and
   the client first pass render identical markup, so hydration is clean and the
   client effect can reconcile to the browser's real year without reaching for
   suppressHydrationWarning, which React documents as NOT patching mismatched
   text content. */
export default function Home() {
  return <HomeContent initialYear={new Date().getFullYear()} />;
}
