"use client";
import { useState, useRef, useEffect } from "react";
import { CalenderIcon, ChevronLeftIcon, ArrowRightIcon } from "@/icons";

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

type Props = {
  value?: string | null;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
};

export default function MonthYearPicker({ value, onChange, placeholder = "MM/YYYY", className = "" }: Props) {
  const parts = value ? value.split("/") : [];
  const selMonth = parts.length === 2 ? parseInt(parts[0]) : null;
  const selYear  = parts.length === 2 ? parseInt(parts[1]) : null;

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => selYear ?? new Date().getFullYear());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (monthIndex: number) => {
    const mm = String(monthIndex + 1).padStart(2, "0");
    onChange(`${mm}/${viewYear}`);
    setOpen(false);
  };

  const handleOpen = () => {
    if (selYear) setViewYear(selYear);
    setOpen((o) => !o);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleOpen}
        className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm flex items-center justify-between gap-2 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800"
      >
        <span className={value ? "text-gray-800 dark:text-white" : "text-gray-400 dark:text-gray-500"}>
          {value || placeholder}
        </span>
        <CalenderIcon className="size-5 shrink-0 text-gray-400 dark:text-gray-500" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-56 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-3">
          {/* Year nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <span className="text-sm font-semibold text-gray-800 dark:text-white">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <ArrowRightIcon className="size-4" />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1">
            {MONTHS.map((m, i) => {
              const active = selMonth === i + 1 && selYear === viewYear;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => pick(i)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? "bg-brand-600 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="mt-2 w-full text-xs text-gray-400 hover:text-red-500 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
              Effacer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
