"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Volume2 } from "lucide-react";
import localFont from "next/font/local";

// Dyslexia-friendly font
const openDyslexic = localFont({
  src: [
    {
      path: "../fonts/OpenDyslexic-Regular.woff2",
      weight: "400",
    },
  ],
  variable: "--font-dyslexic",
});

export default function Home() {
  return (
    <div
      className={`${openDyslexic.variable} font-[var(--font-dyslexic)] flex flex-col items-center min-h-screen w-screen bg-[#121212] text-[#E8E6E3]`}
    >
      {/* HEADER SECTION */}
      <header className="flex flex-col items-center justify-center text-center py-16 px-6 space-y-8">
        <h1 className="text-6xl font-bold tracking-wide leading-snug">
          <span className="block bg-[#2D3436] px-6 py-2 rounded-lg shadow-md mb-3 text-[#F1C40F]">
            Dyslexia Made Easy
          </span>
        </h1>
        <h2 className="text-2xl font-medium text-[#C5C6C7] max-w-2xl">
          AI-powered reading experience — built for clarity, focus, and comfort.
        </h2>
      </header>

      {/* FEATURE SECTION */}
      <main className="w-full flex flex-col items-center px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          {/* MAIN CARD */}
          <Card className="col-span-1 md:col-span-2 flex flex-col md:flex-row gap-6 p-6 bg-[#1E1E1E] border border-[#2A2A2A] rounded-2xl hover:shadow-[0_0_15px_#2ECC71] transition-all">
    
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-3xl font-semibold mb-4 text-[#F8EFBA] flex items-center gap-2">
                  <FileText className="text-[#2ECC71]" />
                  Dyslexia-Friendly Reader
                </h3>
                <p className="text-lg leading-relaxed text-[#DADADA] mb-4">
                  Upload any PDF and our AI transforms it into clear, dyslexia-optimized text.
                  Enjoy reading with enhanced fonts, soft visual contrast, and audio playback.
                </p>
                <ul className="space-y-2 text-base text-[#BFBFBF]">
                  <li className="flex items-center gap-2">
                    <Sparkles size={18} className="text-[#F1C40F]" />
                    <span>AI-powered text simplification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Volume2 size={18} className="text-[#2ECC71]" />
                    <span>Built-in text-to-speech support</span>
                  </li>
                </ul>
              </div>

              <Button
                asChild
                className="w-fit mt-4 bg-[#2ECC71] hover:bg-[#27AE60] text-[#121212] text-lg px-6 py-3 rounded-xl shadow-sm font-semibold"
              >
                <Link href="/upload">Start Reading</Link>
              </Button>
            </div>
          </Card>

          {/* INFO CARD */}
          <Card className="p-6 bg-[#1C1C1C] border border-[#333333] rounded-2xl shadow-md">
            <h3 className="text-2xl font-semibold text-[#F1C40F] mb-4">
              How It Works
            </h3>
            <ol className="space-y-4 text-lg text-[#E8E6E3]">
              <li className="flex gap-3">
                <span className="font-bold text-[#2ECC71]">1.</span>
                <span>Upload your PDF document.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[#2ECC71]">2.</span>
                <span>AI extracts and simplifies the content.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[#2ECC71]">3.</span>
                <span>Select your preferred reading level.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-[#2ECC71]">4.</span>
                <span>Read or listen comfortably — your way.</span>
              </li>
            </ol>
          </Card>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full text-center py-6 border-t border-[#2C2C2C] bg-[#0E0E0E] mt-auto">
        <p className="text-sm text-[#A4B0BE]">
          🌙 Built with care using Claude AI.
        </p>
      </footer>
    </div>
  );
}
