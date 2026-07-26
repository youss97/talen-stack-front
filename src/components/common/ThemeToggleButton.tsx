import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export const ThemeToggleButton: React.FC = () => {
  const { toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center transition-colors border rounded-full h-11 w-11 text-gray-600 hover:text-gray-900 hover:bg-[var(--brand-soft)] dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10"
      style={{ borderColor: "var(--border-strong)" }}
    >
      <Sun size={20} strokeWidth={1.8} className="icon-glow hidden dark:block" />
      <Moon size={20} strokeWidth={1.8} className="icon-glow dark:hidden" />
    </button>
  );
};
