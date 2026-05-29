import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jacob J. Choi — Musician x AI Engineer",
  description:
    "Jacob J. Choi — musician and AI engineer. Admitted to Juilliard for viola; currently building biomedical GraphRAG and agentic AI at The Jackson Laboratory.",
  openGraph: {
    title: "Jacob J. Choi — Musician x AI Engineer",
    description:
      "Admitted to Juilliard for viola; currently building biomedical GraphRAG and agentic AI at The Jackson Laboratory.",
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
