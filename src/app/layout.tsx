import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jacob J. Choi — Violist & AI Engineer",
  description:
    "Jacob J. Choi. Admitted to Juilliard for viola, now building AI systems that ship to production. Research to production, not just notebooks.",
  openGraph: {
    title: "Jacob J. Choi — Violist & AI Engineer",
    description:
      "Admitted to Juilliard for viola, now building AI systems that ship to production.",
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
