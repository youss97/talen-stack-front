"use client";
import {
  useState,
  useRef,
  useEffect,
  useMemo,
  forwardRef,
  useCallback,
} from "react";
import type { CV } from "@/types/cv";

interface CVInfiniteSelectProps {
  label?: string;
  value: string | string[];
  onChange: (value: string | string[], selectedItem?: CV | CV[]) => void;
  useInfiniteQuery?: unknown;
  queryArg?: Record<string, unknown>;
  disabled?: boolean;
  emptyMessage?: string;
  error?: boolean;
  placeholder?: string;
  initialSelectedItems?: CV[];
  multiple?: boolean;
}

function CVInfiniteSelectInner(
  {
    label,
    value,
    onChange,
    useInfiniteQuery,
    queryArg = {},
    disabled = false,
    emptyMessage = "Aucun CV trouvé",
    error = false,
    placeholder = "Sélectionner un CV...",
    initialSelectedItems = [],
    multiple = false,
  }: CVInfiniteSelectProps,
  _ref: React.ForwardedRef<HTMLDivElement>
) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const selectedItemsCache = useRef<Map<string, CV>>(new Map());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLLIElement>(null);

  // Cache initial selected items
  useEffect(() => {
    if (initialSelectedItems && initialSelectedItems.length > 0) {
      initialSelectedItems.forEach((item) => {
        const itemId = String(item.id);
        if (itemId && !selectedItemsCache.current.has(itemId)) {
          selectedItemsCache.current.set(itemId, item);
        }
      });
    }
  }, [initialSelectedItems]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Query params with search
  const queryWithSearch = useMemo(() => {
    return {
      ...queryArg,
      search: debouncedSearch || undefined,
    };
  }, [queryArg, debouncedSearch]);

  // RTK Query infinite query hook
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = (
    useInfiniteQuery as (
      arg: Record<string, unknown>,
      options: { skip?: boolean }
    ) => {
      data?: {
        pages?: { data?: CV[]; results?: CV[] }[];
      };
      fetchNextPage: () => void;
      hasNextPage?: boolean;
      isFetchingNextPage: boolean;
      isLoading: boolean;
    }
  )(queryWithSearch, {
    skip: !isOpen || !useInfiniteQuery,
  });

  // Flatten pages to get all items
  const options: CV[] = useMemo(() => {
    return data?.pages?.flatMap((page) => page.data || page.results || []) || [];
  }, [data?.pages]);

  // Infinite scroll observer
  useEffect(() => {
    if (!isOpen || !hasNextPage) {
      observer.current?.disconnect();
      return;
    }

    const timer = setTimeout(() => {
      if (!sentinelRef.current) return;

      if (observer.current) {
        observer.current.disconnect();
      }

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { threshold: 0.1, root: listRef.current }
      );

      observer.current.observe(sentinelRef.current);
    }, 50);

    return () => {
      clearTimeout(timer);
      observer.current?.disconnect();
    };
  }, [isOpen, hasNextPage, isFetchingNextPage, fetchNextPage, options.length]);

  const formatCVLabel = useCallback((cv: CV): string => {
    if (!cv) return "";
    const firstName = cv.candidate_first_name || "";
    const lastName = cv.candidate_last_name || "";
    const profileTitle = cv.profile_title || cv.last_position || "";
    
    if (firstName || lastName) {
      const fullName = `${firstName} ${lastName}`.trim();
      return profileTitle ? `${fullName} - ${profileTitle}` : fullName;
    }
    
    return profileTitle || cv.candidate_email || `CV #${cv.id}`;
  }, []);

  const getSelectedLabel = (): string => {
    if (multiple) {
      const values = Array.isArray(value) ? value : [];
      if (values.length === 0) return "";
      if (values.length === 1) {
        const foundInOptions = options.find((opt) => String(opt.id) === values[0]);
        if (foundInOptions) return formatCVLabel(foundInOptions);
        const cached = selectedItemsCache.current.get(values[0]);
        if (cached) return formatCVLabel(cached);
        return values[0];
      }
      return `${values.length} sélectionné(s)`;
    }

    if (!value) return "";

    // Check in options first
    const foundInOptions = options.find((opt) => String(opt.id) === value);
    if (foundInOptions) return formatCVLabel(foundInOptions);

    // Check in cache
    const cached = selectedItemsCache.current.get(value as string);
    if (cached) return formatCVLabel(cached);

    return "";
  };

  const handleSelect = (option: CV) => {
    const itemValue = String(option.id) || "";
    if (!itemValue) return;

    selectedItemsCache.current.set(itemValue, option);

    if (multiple) {
      const values = Array.isArray(value) ? value : [];
      const isSelected = values.includes(itemValue);
      const newValues = isSelected
        ? values.filter((v) => v !== itemValue)
        : [...values, itemValue];
      
      // Get all selected CV objects
      const selectedCVs = newValues
        .map(id => selectedItemsCache.current.get(id))
        .filter((cv): cv is CV => cv !== undefined);
      
      onChange(newValues, selectedCVs);
    } else {
      onChange(itemValue, option);
      setIsOpen(false);
      setSearchText("");
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      onChange([], []);
    } else {
      onChange("", undefined);
    }
    setSearchText("");
  };

  const handleRemoveTag = (cvIdToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple && Array.isArray(value)) {
      const newValues = value.filter((v) => v !== cvIdToRemove);
      
      // Get all selected CV objects
      const selectedCVs = newValues
        .map(id => selectedItemsCache.current.get(id))
        .filter((cv): cv is CV => cv !== undefined);
      
      onChange(newValues, selectedCVs);
    }
  };

  const isOptionSelected = (option: CV): boolean => {
    const itemValue = String(option.id) || "";
    if (multiple) {
      const values = Array.isArray(value) ? value : [];
      return values.includes(itemValue);
    }
    return itemValue === value;
  };

  return (
    <div ref={dropdownRef} className="relative">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div
        className={`relative min-h-11 w-full rounded-lg border bg-transparent text-sm shadow-theme-xs cursor-pointer
          ${error
            ? "border-error-500 focus-within:border-error-500 focus-within:ring-error-500/10"
            : "border-gray-300 focus-within:border-brand-300 focus-within:ring-brand-500/10 dark:border-gray-700 dark:focus-within:border-brand-800"
          }
          ${disabled ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800" : ""}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center min-h-11 px-4 py-2">
          {multiple && Array.isArray(value) && value.length > 0 && !isOpen ? (
            <div className="flex flex-wrap gap-1 flex-1">
              {value.map((cvId) => {
                const cached = selectedItemsCache.current.get(cvId);
                const label = cached ? formatCVLabel(cached) : cvId;
                return (
                  <span
                    key={cvId}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded text-xs"
                  >
                    <span className="max-w-[150px] truncate">{label}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveTag(cvId, e)}
                      className="hover:text-brand-900 dark:hover:text-brand-100"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          ) : isOpen ? (
            <input
              type="text"
              className="w-full h-full bg-transparent outline-none text-gray-800 dark:text-white/90 placeholder:text-gray-400"
              placeholder={placeholder}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <span
              className={`flex-1 truncate ${
                (multiple ? (Array.isArray(value) && value.length > 0) : value)
                  ? "text-gray-800 dark:text-white/90"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {getSelectedLabel() || placeholder}
            </span>
          )}

          <div className="flex items-center gap-1 ml-2">
            {((multiple && Array.isArray(value) && value.length > 0) || (!multiple && value)) && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <ul
            ref={listRef}
            className="max-h-60 overflow-y-auto custom-scrollbar"
          >
            {isLoading ? (
              <li className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
                  Chargement...
                </div>
              </li>
            ) : options.length === 0 ? (
              <li className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                {emptyMessage}
              </li>
            ) : (
              <>
                {options.map((option, index) => {
                  const isSelected = isOptionSelected(option);
                  const isLast = index === options.length - 1;

                  return (
                    <li
                      key={option.id}
                      className={`px-4 py-2.5 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => handleSelect(option)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col flex-1">
                          <span className="font-medium">
                            {formatCVLabel(option)}
                          </span>
                        </div>
                        {multiple && isSelected && (
                          <span className="ml-2 text-brand-600 dark:text-brand-400">✓</span>
                        )}
                      </div>
                      {isLast && hasNextPage && (
                        <span
                          ref={sentinelRef}
                          style={{ height: 1, width: "100%", visibility: "hidden", display: "block" }}
                        />
                      )}
                    </li>
                  );
                })}
                {isFetchingNextPage && (
                  <li className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                      <div className="w-3 h-3 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
                    </div>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

const CVInfiniteSelect = forwardRef(CVInfiniteSelectInner);

export default CVInfiniteSelect;