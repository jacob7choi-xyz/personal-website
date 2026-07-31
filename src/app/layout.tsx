import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  // Stated explicitly rather than inferred. Without it Next derives the base for
  // relative metadata URLs from the deployment environment, which resolved
  // og:image to the apex while og:url was declared with www. Both hosts serve the
  // image, so nothing was broken, but the pair disagreed and the value depended on
  // environment variables instead of on this file.
  metadataBase: new URL("https://www.jacobjchoi.xyz"),
  title: "Jacob J. Choi, Musician x AI Engineer",
  description:
    "Jacob J. Choi, musician and AI engineer. Admitted to Juilliard for viola, currently building biomedical GraphRAG and agentic AI at The Jackson Laboratory.",
  // The site answers on both the apex and www. A canonical names one of them as
  // the indexable address so the two are not treated as competing duplicates.
  alternates: { canonical: "/" },
  openGraph: {
    title: "Jacob J. Choi, Musician x AI Engineer",
    description:
      "Admitted to Juilliard for viola, currently building biomedical GraphRAG and agentic AI at The Jackson Laboratory.",
    url: "https://www.jacobjchoi.xyz/",
    siteName: "Jacob J. Choi",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/Jacob-Choi-Website-Logo.ico" />
      </head>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
