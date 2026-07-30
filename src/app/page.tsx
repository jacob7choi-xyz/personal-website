import HomeContent from "./HomeContent";

/* Server component on purpose. The content needs client hooks (Framer Motion),
   but the footer year must not freeze in the prerendered HTML. Computing it here
   and passing it down makes the server and the client first pass render
   identical markup, so hydration is clean and the effect can reconcile without
   suppressHydrationWarning, which React documents as NOT patching mismatched
   text content. */
export default function Home() {
  return <HomeContent initialYear={new Date().getFullYear()} />;
}
