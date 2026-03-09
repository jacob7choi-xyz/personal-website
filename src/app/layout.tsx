import type { Metadata } from "next";
import "./globals.css";
import CursorAura from "@/components/Global/CursorAura";

export const metadata: Metadata = {
  title: "Jacob J. Choi",
  description: "Jacob J. Choi - AI Engineer, Researcher, Entrepreneur.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/Jacob-Choi-Website-Logo.ico"/>
      </head>
      <body>
        {/* Floating ambient orbs */}
        <div className="orb orb-1" style={{ top: '-10%', left: '-10%' }} />
        <div className="orb orb-2" style={{ top: '40%', right: '-15%' }} />
        <div className="orb orb-3" style={{ bottom: '10%', left: '20%' }} />

        <CursorAura />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
