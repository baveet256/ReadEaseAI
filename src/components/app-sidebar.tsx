"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { FontSelector } from "./ui/fontSelector";
import { Geist, Atkinson_Hyperlegible } from "next/font/google";
import localFont from "next/font/local";
import { useEffect, useState } from "react";
import { Slider } from "./ui/slider";
import { Button } from "@/components/ui/button";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const atkinsonHyperlegible = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
});
const openDyslexic = localFont({
  src: "../../public/fonts/OpenDyslexic-Regular.woff2",
});

export function AppSidebar() {
  const [font, setFont] = useState("Sans");
  const [spacing, setSpacing] = useState(1.5);
  const [theme, setTheme] = useState("sepia");

  const themes = [
    { id: "sepia", label: "Sepia", bg: "#FDF6EC", text: "#2B2B2B" },
    { id: "cream", label: "Cream", bg: "#FFFBEA", text: "#1A1A1A" },
    { id: "dark", label: "Dark", bg: "#444444", text: "#EEEEEE" },
  ];

  const currentTheme = themes.find((t) => t.id === theme)!;

  // Apply background/text colors globally
  useEffect(() => {
    document.body.style.backgroundColor = currentTheme.bg;
    document.body.style.color = currentTheme.text;
  }, [currentTheme]);

  // Apply letter spacing globally
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "custom-spacing";
    style.innerHTML = `
      body, p, h1, h2, h3, h4, span, div {
        letter-spacing: ${spacing}px !important;
      }
    `;
    const oldStyle = document.getElementById("custom-spacing");
    if (oldStyle) oldStyle.remove();
    document.head.appendChild(style);
    return () => {
      const remove = document.getElementById("custom-spacing");
      if (remove) remove.remove();
    };
  }, [spacing]);

  // Apply selected font
  useEffect(() => {
    document.body.classList.remove(
      geistSans.className,
      openDyslexic.className,
      atkinsonHyperlegible.className
    );
    if (font) document.body.classList.add(font);
  }, [font]);

  return (
    <Sidebar className={`bg-[${currentTheme.bg}] text-[${currentTheme.text}]`}>
      <SidebarHeader
        className="text-center py-4 text-xl font-bold"
        style={{ color: currentTheme.text }}
      >
        View Settings
      </SidebarHeader>

      <SidebarContent className="space-y-6">
        {/* FONT */}
        <SidebarGroup>
          <SidebarGroupLabel style={{ color: currentTheme.text }}>
            Font
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <FontSelector fonts={[
              { label: "Sans", value: geistSans.className },
              { label: "OpenDyslexic", value: openDyslexic.className },
              { label: "Atkinson Hyperlegible", value: atkinsonHyperlegible.className },
            ]} onChange={(font) => setFont(font)} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* LETTER SPACING */}
        <SidebarGroup>
          <SidebarGroupLabel style={{ color: currentTheme.text }}>
            Letter Spacing
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <Slider
              min={0}
              max={5}
              step={0.5}
              value={[spacing]}
              onValueChange={(val) => setSpacing(val[0])}
            />
            <p style={{ color: currentTheme.text }} className="text-xs mt-1">
              Current: {spacing}px
            </p>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* THEME */}
        <SidebarGroup>
          <SidebarGroupLabel style={{ color: currentTheme.text }}>
            Theme
          </SidebarGroupLabel>
          <SidebarGroupContent className="flex flex-col gap-2">
            {themes.map((t) => (
              <Button
                key={t.id}
                variant={theme === t.id ? "default" : "outline"}
                onClick={() => setTheme(t.id)}
                style={{
                  backgroundColor: theme === t.id ? t.bg : "transparent",
                  color: theme === t.id ? t.text : currentTheme.text,
                  borderColor: currentTheme.text,
                }}
                className="justify-start"
              >
                <div
                  className="w-4 h-4 rounded-full mr-2 border"
                  style={{ backgroundColor: t.bg }}
                />
                {t.label}
              </Button>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 text-xs" style={{ color: currentTheme.text }}>
        Accessibility-first reading experience
      </SidebarFooter>
    </Sidebar>
  );
}
