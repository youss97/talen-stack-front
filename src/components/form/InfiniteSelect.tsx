"use client";
import React from "react";
import {
  useState,
  useRef,
  useEffect,
  useMemo,
  forwardRef,
  useCallback,
} from "react";
import { X, ChevronDown } from "lucide-react";

interface InfiniteSelectProps<T> {
  label: React.ReactNode;
  value: string;
  onChange: (value: string, selectedItem?: T) => void;
  useInfiniteQuery: unknown;
  queryArg?: Record<string, unknown>;
  disabled?: boolean;
  itemLabelKey?: string;
  /** Prioritaire sur itemLabelKey : permet de combiner plusieurs champs (ex. nom + titre) */
  getOptionLabel?: (item: T) => string;
  itemValueKey?: string;
  emptyMessage?: string;
  error?: boolean;
  placeholder?: string;
  initialSelectedItems?: T[];
}

function InfiniteSelectInner<T extends Record<string, unknown>>(
  {
    label,
    value,
    onChange,
    useInfiniteQuery,
    queryArg = {},
    disabled = false,
    itemLabelKey = "name",
    getOptionLabel: getOptionLabelProp,
    itemValueKey = "id",
    emptyMessage = "Aucun élément trouvé",
    error = false,
    placeholder = "Sélectionner...",
    initialSelectedItems = [],
  }: InfiniteSelectProps<T>,
  _ref: React.ForwardedRef<HTMLDivElement>
) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const selectedItemsCache = useRef<Map<string, T>>(new Map());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLLIElement>(null);

  // Cache initial selected items
  useEffect(() => {
    if (initialSelectedItems && initialSelectedItems.length > 0) {
      initialSelectedItems.forEach((item) => {
        const itemId = String(item[itemValueKey as keyof T]);
        if (itemId && !selectedItemsCache.current.has(itemId)) {
          selectedItemsCache.current.set(itemId, item);
        }
      });
    }
  }, [initialSelectedItems, itemValueKey]);

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

  // Close dropdown on scroll or resize — mais ignore le scroll interne à la liste
  // (sinon impossible de scroller les options : chaque scroll de la liste ferme le dropdown)
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (e: Event) => {
      if (dropdownRef.current && e.target instanceof Node && dropdownRef.current.contains(e.target)) {
        return;
      }
      setIsOpen(false);
    };
    const handleResize = () => {
      setIsOpen(false);
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  // Query params with search
  const queryWithSearch = useMemo(() => {
    return {
      ...queryArg,
      search: debouncedSearch || undefined,
    };
  }, [queryArg, debouncedSearch]);

  // RTK Query infinite query hook - same pattern as AutocompleteInfiniteScroll
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = (
    useInfiniteQuery as (
      arg: Record<string, unknown>,
      options: { skip?: boolean }
    ) => {
      data?: {
        pages?: { data?: T[]; results?: T[] }[];
      };
      fetchNextPage: () => void;
      hasNextPage?: boolean;
      isFetchingNextPage: boolean;
      isLoading: boolean;
    }
  )(queryWithSearch, {
    skip: !isOpen,
  });

  // Flatten pages to get all items
  const options: T[] = useMemo(() => {
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

  const getOptionLabel = useCallback(
    (option: T): string => {
      if (!option) return "";
      if (getOptionLabelProp) return getOptionLabelProp(option);
      return String(option[itemLabelKey as keyof T] || "");
    },
    [itemLabelKey, getOptionLabelProp]
  );

  const getSelectedLabel = (): string => {
    if (!value) return "";

    // Check in options first
    const foundInOptions = options.find(
      (opt) => String(opt[itemValueKey as keyof T]) === value
    );
    if (foundInOptions) return getOptionLabel(foundInOptions);

    // Check in cache
    const cached = selectedItemsCache.current.get(value);
    if (cached) return getOptionLabel(cached);

    return "";
  };

  const handleSelect = (option: T) => {
    const itemValue = String(option[itemValueKey as keyof T]);
    selectedItemsCache.current.set(itemValue, option);
    onChange(itemValue, option);
    setIsOpen(false);
    setSearchText("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchText("");
  };

  return (
    <div ref={dropdownRef} className="relative">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div
        className={`relative h-11 w-full rounded-lg border bg-transparent text-sm shadow-theme-xs cursor-pointer
          ${error
            ? "border-error-500 focus-within:border-error-500 focus-within:ring-error-500/10"
            : "border-gray-300 focus-within:border-brand-300 focus-within:ring-brand-500/10 dark:border-gray-700 dark:focus-within:border-brand-800"
          }
          ${disabled ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800" : ""}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center h-full px-4">
          {isOpen ? (
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
                value
                  ? "text-gray-800 dark:text-white/90"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {getSelectedLabel() || placeholder}
            </span>
          )}

          <div className="flex items-center gap-1 ml-2">
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={14} strokeWidth={1.8} className="icon-glow" />
              </button>
            )}
            <ChevronDown
              size={16}
              strokeWidth={1.8}
              className={`icon-glow text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      </div>

      {isOpen && (
        <div 
          className="fixed z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden"
          style={{
            top: dropdownRef.current ? `${dropdownRef.current.getBoundingClientRect().bottom + 4}px` : '0',
            left: dropdownRef.current ? `${dropdownRef.current.getBoundingClientRect().left}px` : '0',
            width: dropdownRef.current ? `${dropdownRef.current.getBoundingClientRect().width}px` : 'auto',
          }}
        >
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
                  const optionValue = String(option[itemValueKey as keyof T]);
                  const isSelected = optionValue === value;
                  const isLast = index === options.length - 1;

                  return (
                    <li
                      key={optionValue}
                      className={`px-4 py-2.5 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => handleSelect(option)}
                    >
                      {getOptionLabel(option)}
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

const InfiniteSelect = forwardRef(InfiniteSelectInner) as <
  T extends Record<string, unknown>
>(
  props: InfiniteSelectProps<T> & {
    ref?: React.ForwardedRef<HTMLDivElement>;
  }
) => React.ReactElement;

export default InfiniteSelect;
