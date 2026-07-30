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
    bio: {
      intro: "CS:AI student at Colby College (graduating May 2027). AI/Agentic Pipeline Engineer at The Jackson Laboratory, currently building a production agentic system and biomedical GraphRAG corpus for rural patients in Maine and North Carolina under the Maine Cancer Genomics Initiative, helping clinicians identify the right cancer treatment for each patient, backed by a three-year grant from the Duke Endowment. Focused on agent orchestration, lexicogrammar noise reduction, and citation-verified evidence ranking and retrieval.",
      introLinks: [
        { text: "Maine Cancer Genomics Initiative", url: "https://www.jax.org/clinical-genomics/maine-cancer-genomics-initiative" }
      ],
      focus: "Prior research at USC's Institute for Creative Technologies and a Turing study with Microsoft Research. Founder of TuneTales (AI music storytelling) and creator of HarmonyRestorer (AI audio restoration with a custom OpGAN).",
      focusLinks: [
        { text: "Turing study", url: "https://drive.google.com/file/d/1F9lYxAleIydY2zrBPGXKbcYojcdidbvQ/view?usp=sharing" },
        { text: "HarmonyRestorer", url: "https://github.com/jacob7choi-xyz/harmonyrestorer-v1" },
        { text: "TuneTales", url: "https://github.com/jacob7choi-xyz/tunetales-v1" },
        { text: "custom OpGAN", url: "https://arxiv.org/abs/2212.14618" }
      ]
    }
  };