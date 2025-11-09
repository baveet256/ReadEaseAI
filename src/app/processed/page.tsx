"use client";
import { useState, useEffect } from "react";
import { Volume2, PauseCircle, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import localFont from "next/font/local";

// Load OpenDyslexic font (fallback to system sans-serif)
const openDyslexic = localFont({
  src: [
    {
      path: "../fonts/OpenDyslexic-Regular.woff2",
      weight: "400",
    },
  ],
  variable: "--font-dyslexic",
});

export default function Refined() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [refinedText, setRefinedText] = useState<string>("");
  const [defaultText, setDefaultText] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [rephrased, setRephrased] = useState<string>("");
  const [level, setLevel] = useState<string>("moderate");
  const [loading, setLoading] = useState(true);
  const [activeColumn, setActiveColumn] = useState<"text" | "summary">("text");

  useEffect(() => {
    const savedText = sessionStorage.getItem("pdfText");
    if (!savedText) {
      setDefaultText("No text found. Please upload a PDF first.");
      setLoading(false);
      return;
    }

    setDefaultText(savedText);
    setRefinedText(savedText);

    const fetchRefinedText = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/levels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputText: savedText, readingLevel: level }),
        });
        if (!res.ok) throw new Error("Failed to process text");
        const data = await res.json();
        setSummary(data.summary || "");
        setRephrased(data.rephrased || savedText);
        setRefinedText(data.rephrased || savedText);
      } catch (error) {
        console.error("Error:", error);
        setSummary("Error processing text.");
      } finally {
        setLoading(false);
      }
    };

    fetchRefinedText();
  }, [level]);

  const playChunks = async (textToPlay?: string) => {
    const text = textToPlay || (activeColumn === "summary" ? summary : refinedText);
    if (isPlaying || !text) return;

    try {
      const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}`);
      const data = await res.json();
      if (!data.base64Chunks) return;

      const playSequential = (i: number) => {
        if (i >= data.base64Chunks.length) {
          setIsPlaying(false);
          return;
        }
        const newAudio = new Audio(`data:audio/mp3;base64,${data.base64Chunks[i].base64}`);
        newAudio.play();
        newAudio.onended = () => playSequential(i + 1);
        setAudio(newAudio);
      };
      playSequential(0);
      setIsPlaying(true);
    } catch (e) {
      console.error(e);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
    } else {
      playChunks();
    }
  };

  const formatText = (t: string) =>
    t.split(/[.!?]+/).filter(Boolean).map((s, i) => (
      <p key={i} className="mb-6 leading-loose tracking-wide text-[20px]">
        {s.trim()}.
      </p>
    ));

  return (
    <div className={`${openDyslexic.variable} font-[var(--font-dyslexic)] min-h-screen bg-[#f2edd7] text-[#1a1a1a] p-6`}>
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-[#2D3748] tracking-wider">
            Friendly Reading
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Controls */}
        <div className="bg-[#c4b676] rounded-2xl p-6 shadow-sm border border-[#E6E2C3] h-fit sticky top-6">
          <h2 className="text-2xl font-semibold mb-6 text-[#3C3A2E]">Simplify Level</h2>
          <RadioGroup value={level} onValueChange={setLevel} disabled={loading} className="space-y-3">
            {["smallest", "smaller", "moderate"].map((v) => (
              <div
                key={v}
                className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-[#EEEAD0] transition-all ${
                  level === v ? "bg-[#E8E2B8]" : ""
                }`}
              >
                <RadioGroupItem value={v} id={v} />
                <Label htmlFor={v} className="capitalize cursor-pointer text-lg">
                  {v}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {loading && (
            <div className="mt-6 flex items-center gap-3 text-[#5B5A4A]">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-sm">Rephrasing text...</span>
            </div>
          )}

          <div className="mt-6 p-4 bg-[#FDF6E3] rounded-lg border border-[#EDE7C8]">
            <p className="text-sm text-[#554E32] leading-relaxed">
              💡 Compact sentences from smallest to optimal level for dyslexia readers.
            </p>
          </div>
        </div>

        {/* Reading Section */}
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-3">
            {["text", "summary"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveColumn(tab as any)}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold text-lg tracking-wide ${
                  activeColumn === tab
                    ? "bg-[#B6D6A8] text-[#1B1B1B] shadow-md"
                    : "bg-[#FFFFFF] border border-[#E6E2C3] hover:bg-[#F8F5E8]"
                }`}
              >
                {tab === "text" ? "Simplified Text" : "Short Summary"}
              </button>
            ))}
          </div>

          {/* Text Area */}
          <div className="bg-[#dabdbd] rounded-2xl shadow-sm border border-[#E6E2C3] overflow-hidden">
            <div className="p-6 border-b border-[#EDE7C8] flex items-center justify-between bg-[#F9F7E5]">
              <h2 className="text-3xl font-bold text-[#3C3A2E]">
                {activeColumn === "text" ? "Simplified Reading" : "Quick Overview"}
              </h2>
              <Button
                onClick={togglePlayPause}
                disabled={loading}
                size="lg"
                className="bg-[#A4C3A2] hover:bg-[#91B68F] text-[#1a1a1a] gap-2"
              >
                {isPlaying ? <><PauseCircle size={24} /> Pause</> : <><Volume2 size={24} /> Listen</>}
              </Button>
            </div>

            <div className="p-8 min-h-[60vh] max-h-[70vh] overflow-y-auto leading-relaxed text-[20px] tracking-wide">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-[#4A4A3A]">
                  <Loader2 className="animate-spin" size={48} />
                  <p className="text-xl">Processing your reading...</p>
                </div>
              ) : (
                <div className="prose prose-lg max-w-none text-[#1A1A1A] font-medium">
                  {activeColumn === "text"
                    ? formatText(rephrased || refinedText || defaultText)
                    : formatText(summary)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
