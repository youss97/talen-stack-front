"use client";
import { Calendar } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();

type Props = {
  value?: string | null;
  onChange: (val: string) => void;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
  className?: string;
};

export default function YearPicker({
  value,
  onChange,
  placeholder = "Année",
  minYear = 1960,
  maxYear = CURRENT_YEAR + 2,
  className = "",
}: Props) {
  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);

  return (
    <div className={`relative ${className}`}>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white dark:focus:border-brand-800 bg-transparent cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>
      <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
        <Calendar size={20} strokeWidth={1.5} className="icon-glow" />
      </span>
    </div>
  );
}
