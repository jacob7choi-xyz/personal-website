import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import FloatingCubes from '@/components/Global/FloatingDice';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jacob J. Choi",
  description: "Jacob J. Choi - Full-Stack Developer & AI Enthusiast.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/Jacob-Choi-Website-Logo.ico"/>
      </head>
      <body className={inter.className}>
        <FloatingCubes />
        {children}
      </body>
    </html>
  );
}
