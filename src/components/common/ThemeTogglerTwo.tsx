"use client";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeTogglerTwo() {
  const { toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="inline-flex size-14 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-600"
    >
      <Sun size={20} strokeWidth={1.8} className="icon-glow hidden dark:block" />
      <Moon size={20} strokeWidth={1.8} className="icon-glow dark:hidden" />
    </button>
  );
}
