"use client";
import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";

interface MultiInfiniteSelectProps<T> {
  label?: string;
  value: string[];
  onChange: (value: string[]) => void;
  useInfiniteQuery: any;
  queryArg?: Record<string, unknown>;
  disabled?: boolean;
  emptyMessage?: string;
  error?: boolean;
  placeholder?: string;
  getOptionLabel: (item: T) => string;
  getOptionValue: (item: T) => string;
  multiple?: boolean;
}

function MultiInfiniteSelect<T extends Record<string, unknown>>({
  label,
  value,
  onChange,
  useInfiniteQuery,
  queryArg = {},
  disabled = false,
  emptyMessage = "Aucun élément trouvé",
  error = false,
  placeholder = "Sélectionner...",
  getOptionLabel,
  getOptionValue,
  multiple = true,
}: MultiInfiniteSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const selectedItemsCache = useRef<Map<string, T>>(new Map());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLLIElement>(null);

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
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery(queryWithSearch, {
      skip: !isOpen,
    });

  // Flatten pages to get all items
  const options: T[] = useMemo(() => {
    return data?.pages?.flatMap((page: any) => page.data || page.results || []) || [];
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

  const handleSelect = (option: T) => {
    const itemValue = getOptionValue(option);
    if (!itemValue) return;

    selectedItemsCache.current.set(itemValue, option);

    if (multiple) {
      const isSelected = value.includes(itemValue);
      const newValues = isSelected
        ? value.filter((v) => v !== itemValue)
        : [...value, itemValue];
      onChange(newValues);
    } else {
      onChange([itemValue]);
      setIsOpen(false);
      setSearchText("");
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
    setSearchText("");
  };

  const handleRemoveTag = (valueToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValues = value.filter((v) => v !== valueToRemove);
    onChange(newValues);
  };

  const isOptionSelected = (option: T): boolean => {
    const itemValue = getOptionValue(option);
    return value.includes(itemValue);
  };

  const getDisplayLabel = useCallback((val: string): string => {
    const foundInOptions = options.find((opt) => getOptionValue(opt) === val);
    if (foundInOptions) return getOptionLabel(foundInOptions);

    const cached = selectedItemsCache.current.get(val);
    if (cached) return getOptionLabel(cached);

    return val;
  }, [options, getOptionLabel, getOptionValue]);

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
          {multiple && value.length > 0 && !isOpen ? (
            <div className="flex flex-wrap gap-1 flex-1">
              {value.map((val) => (
                <span
                  key={val}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded text-xs"
                >
                  <span className="max-w-[150px] truncate">{getDisplayLabel(val)}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveTag(val, e)}
                    className="hover:text-brand-900 dark:hover:text-brand-100"
                  >
                    ×
                  </button>
                </span>
              ))}
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
                value.length > 0
                  ? "text-gray-800 dark:text-white/90"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {value.length > 0 ? `${value.length} sélectionné(s)` : placeholder}
            </span>
          )}

          <div className="flex items-center gap-1 ml-2">
            {value.length > 0 && !disabled && (
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
                      key={getOptionValue(option)}
                      className={`px-4 py-2.5 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => handleSelect(option)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex-1">{getOptionLabel(option)}</span>
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

export default MultiInfiniteSelect;
