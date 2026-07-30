import { defineAnnotatedProse } from "@/lib/annotated-text";

/* The single source of truth for which networks the design supports. The icon
   and color registry in HomeContent is typed `Record<SocialName, ...>`, so it is
   exhaustiveness-checked against this union: adding a name here without a
   registry entry fails the build, and a registry key that is not a SocialName
   fails too. That replaces a runtime fallback with a compile-time contract. */
export type SocialName = "GitHub" | "LinkedIn" | "X" | "Instagram" | "YouTube";

type SocialLink = {
  name: SocialName;
  url: `https://${string}`;
};

export const socialLinks = [
    {
      name: "GitHub",
      url: "https://github.com/jacob7choi-xyz",
    },
    {
      name: "LinkedIn", 
      url: "https://www.linkedin.com/in/jacobjchoi/",
    },
    {
      name: "X",
      url: "https://x.com/jacob7choii",
    },
    {
      name: "Instagram",
      url: "https://www.instagram.com/jacob7choi/",
    },
    {
      name: "YouTube",
      url: "https://youtube.com/@jacob7choi",
    }
  ] satisfies readonly SocialLink[];
  
  export const personalInfo = {
    name: "Jacob J. Choi",
    title: "AI Engineer • Research to Production • Entrepreneur",
    email: "jacob77choi@gmail.com",
    status: "\"Melos contra mundum\"",
    contactBlurb: "Open to conversations about AI engineering, research-to-production, and good music.",
    /* Prose stays prose. Annotations live NEXT TO the text they depend on, rather
       than in the component, because the thing that has to change when the copy
       changes should be visible from the copy. Each phrase must appear exactly
       once, ranges may not overlap, links must be real https URLs, and accents
       come from a closed vocabulary. Violate any of that and the BUILD FAILS
       instead of silently dropping the highlight. See src/lib/annotated-text.ts. */
    bio: {
      intro: defineAnnotatedProse({
        text: "CS:AI student at Colby College (graduating May 2027). AI/Agentic Pipeline Engineer at The Jackson Laboratory, currently building a production agentic system and biomedical GraphRAG corpus for rural patients in Maine and North Carolina under the Maine Cancer Genomics Initiative, helping clinicians identify the right cancer treatment for each patient, backed by a three-year grant from the Duke Endowment. Focused on agent orchestration, lexicogrammar noise reduction, and citation-verified evidence ranking and retrieval.",
        annotations: [
          { kind: "accent", phrase: "biomedical GraphRAG", accent: "cyan" },
          { kind: "link", phrase: "Maine Cancer Genomics Initiative", href: "https://www.jax.org/clinical-genomics/maine-cancer-genomics-initiative" },
          { kind: "accent", phrase: "three-year grant from the Duke Endowment", accent: "violetSoft" },
        ],
      }),
      focus: defineAnnotatedProse({
        text: "Prior research at USC's Institute for Creative Technologies and a Turing study with Microsoft Research. Founder of TuneTales (AI music storytelling) and creator of HarmonyRestorer (AI audio restoration with a custom OpGAN).",
        annotations: [
          { kind: "link", phrase: "Turing study", href: "https://drive.google.com/file/d/1F9lYxAleIydY2zrBPGXKbcYojcdidbvQ/view?usp=sharing" },
          { kind: "link", phrase: "TuneTales", href: "https://github.com/jacob7choi-xyz/tunetales-v1" },
          { kind: "link", phrase: "HarmonyRestorer", href: "https://github.com/jacob7choi-xyz/harmonyrestorer-v1" },
          { kind: "link", phrase: "custom OpGAN", href: "https://arxiv.org/abs/2212.14618" },
        ],
      }),
    },
  };