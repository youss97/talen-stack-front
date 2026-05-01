import React, { useState, useEffect, useRef } from "react";

interface Option {
  value: string;
  text: string;
  selected: boolean;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  defaultSelected?: string[];
  onChange?: (selected: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  defaultSelected = [],
  onChange,
  disabled = false,
  placeholder = "Sélectionner...",
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(defaultSelected);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync avec les valeurs externes (ex: reset du formulaire, mode édition)
  useEffect(() => {
    setSelectedOptions(defaultSelected);
  }, [JSON.stringify(defaultSelected)]);

  // Fermer le dropdown au clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (optionValue: string) => {
    const next = selectedOptions.includes(optionValue)
      ? selectedOptions.filter((v) => v !== optionValue)
      : [...selectedOptions, optionValue];
    setSelectedOptions(next);
    if (onChange) onChange(next);
  };

  const removeOption = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    const next = selectedOptions.filter((v) => v !== value);
    setSelectedOptions(next);
    if (onChange) onChange(next);
  };

  const selectedTexts = selectedOptions.map(
    (value) => options.find((o) => o.value === value)?.text || value
  );

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
          {label}
        </label>
      )}

      <div className="relative z-20 w-full">
        {/* Trigger */}
        <div
          onClick={toggleDropdown}
          className={`flex min-h-11 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 shadow-theme-xs transition dark:border-gray-700 dark:bg-gray-900 ${
            disabled ? "cursor-not-allowed opacity-60" : "hover:border-brand-300"
          } ${isOpen ? "border-brand-300 ring-3 ring-brand-500/10" : ""}`}
        >
          <div className="flex flex-1 flex-wrap gap-1.5">
            {selectedTexts.length > 0 ? (
              selectedTexts.map((text, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-sm text-gray-800 dark:bg-gray-800 dark:text-white/90"
                >
                  {text}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => removeOption(e, selectedOptions[idx])}
                      className="ml-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M3.407 4.469a.75.75 0 011.061-1.061L7 5.939l2.532-2.531a.75.75 0 111.06 1.06L8.061 7l2.531 2.531a.75.75 0 11-1.06 1.061L7 8.061l-2.532 2.531a.75.75 0 11-1.06-1.06L5.939 7 3.407 4.469z"
                        />
                      </svg>
                    </button>
                  )}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-400 dark:text-gray-500">{placeholder}</span>
            )}
          </div>
          <svg
            className={`ml-auto h-5 w-5 shrink-0 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M4.792 7.396L10 12.604l5.208-5.208" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                Aucune option disponible
              </div>
            ) : (
              options.map((option) => {
                const isSelected = selectedOptions.includes(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      isSelected ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400" : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isSelected
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                          <path d="M8.5 2L4 7.5 1.5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                      )}
                    </span>
                    {option.text}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSelect;
