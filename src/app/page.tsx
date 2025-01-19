"use client"; // To ensure this is marked as a client component

import Image from "next/image";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Create the custom cursor
    const cursor = document.createElement("div");
    cursor.classList.add("custom-cursor");
    document.body.appendChild(cursor);

    const handleMouseMove = (e: MouseEvent) => {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    };

    const links = document.querySelectorAll("a");
    links.forEach((link) => {
      link.addEventListener("mouseover", () => {
        cursor.classList.add("hovered");
      });
      link.addEventListener("mouseout", () => {
        cursor.classList.remove("hovered");
      });
    });

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.body.removeChild(cursor);
    };
  }, []);

  return (
    <div className="font-sans antialiased bg-black text-white min-h-screen">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row justify-between items-start gap-12">
        
        {/* Left Section: Name, Image, and Socials */}
        <div className="lg:w-2/3">
          <div className="flex flex-col items-start space-y-4">
            <h1 className="text-6xl font-serif">Jacob J. Choi</h1>
            <p className="text-xl font-mono">Full-Stack Developer, AI Engineer, Entrepreneur</p>
            <a href="mailto:jchoi26@colby.edu" className="hover:underline">jchoi26@colby.edu</a>

            {/* Headshot */}
            <div className="mt-6">
              <Image
                src="/Jacob_Choi_Headshot.JPG"
                alt="Jacob Choi"
                width={300}
                height={300}
                className="rounded-lg border-2 border-gray-700"
              />
            </div>

            {/* Links to Socials */}
            <div className="mt-6 space-y-2">
              <a href="https://x.com/jacob7choii" target="_blank" rel="noopener noreferrer" className="hover:underline">X↗ </a>
              <a href="https://www.linkedin.com/in/jacobjchoi/" target="_blank" rel="noopener noreferrer" className="hover:underline">LinkedIn↗ </a>
              <a href="https://github.com/jacob7choi-xyz" target="_blank" rel="noopener noreferrer" className="hover:underline">GitHub↗ </a>
              <a href="https://www.instagram.com/jacob7choi/" target="_blank" rel="noopener noreferrer" className="hover:underline">Instagram↗ </a>
            </div>
          </div>

          {/* Content Sections */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16">
            {/* Column 1: Currently */}
            <div>
              <h2 className="text-lg font-bold mb-4">Currently</h2>
              <ul className="space-y-2">
                <li>01 Studying Computer Science: AI @ Colby College↗</li>
                <li>02 Co-Founder/CEO @ TuneTales – An AI-powered storytelling toolkit</li>
                <li>03 Researching LLMs for AI-human interaction w/ Director of Engineering @ Microsoft Research</li>
                <li>04 Streamlining AI oncology workflows @ The Jackson Laboratory</li>
              </ul>
            </div>

          {/* Column 2: Past Life */}
          <div>
            <h2 className="text-lg font-bold mb-4">Past Life</h2>
            <ul className="space-y-2">
              <li>01 AI/ML Research Intern @ USC ICT</li>
              <li>02 Investment Analyst Intern @ Colby Endowment</li>
              <li>03 Semi-Finalist for Greenlight Maine Collegiate Entrepreneurship Competition</li>
              <li>04 1st Place Winner of Colby Back of the Napkin Entrepreneurship Challenge</li>
              <li>05 Admitted to The Juilliard School in Viola Performance</li>
              <li>06 Featured on NPR’s “From The Top” radio program (Show 412)</li>
              </ul>
            </div>

            {/* Column 3: Selected Projects */}
            <div>
              <h2 className="text-lg font-bold mb-4">Selected Projects</h2>
              <ul className="space-y-2">
                <li>01 TuneTales: AI-powered toolkit to simplify storytelling and forge deeper connections between artists and superfans (React Native, AI)</li>
                <li>02 Turing Test Experiments: AI-human interaction studies extending the Turing Imitation Game (Prompt Engineering, GPT-4o, Claude 3.5 Sonnet)</li>
                <li>03 SneakerPrice: AI-powered resale price predictor for sneakers, combining market trends, sentiment analysis, and an interactive dashboard (React, Python, TensorFlow).</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Section: Concise Bio */}
        <div className="lg:w-1/3 text-left lg:text-left mt-40 -ml-0">
          <p className="text-md text-red-300 leading-relaxed">
            Twenty-one. Building tech products and startups. <br />
            Currently exploring full-stack development, AI, and LLMs. <br />
            Blending innovation, creativity, and critical-thinking from education to startups.
          </p>
        </div>
      </div>

      {/* Custom Cursor */}
      <style jsx global>{`
        body {
          cursor: none;
        }

        .custom-cursor {
          position: fixed;
          top: 0;
          left: 0;
          width: 50px;
          height: 50px;
          background-image: url('/navigation.png'); /* Path to your custom cursor image */
          background-size: contain;
          pointer-events: none;
          z-index: 10000;
          transition: transform 0.1s ease-out;
        }

        .custom-cursor.hovered {
          transform: scale(1.5); /* Enlarge cursor on hover */
        }

        a, button {
          cursor: none; /* Remove default cursor for links and buttons */
        }
      `}</style>
    </div>
  );
}
