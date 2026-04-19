'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface AutocompleteOption {
  value: string;
  label: string;
  subtitle?: string;
}

interface AutocompletePaginatedProps {
  onSearch: (searchTerm: string, page: number) => Promise<{
    data: AutocompleteOption[];
    hasMore: boolean;
    total: number;
  }>;
  value?: string;
  onChange: (value: string, option?: AutocompleteOption) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  noOptionsMessage?: string;
  searchPlaceholder?: string;
  minSearchLength?: number;
  pageSize?: number;
  debounceMs?: number;
}

// Composants d'icônes simples en SVG
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LoadingIcon = ({ className }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function AutocompletePaginated({
  onSearch,
  value,
  onChange,
  placeholder = 'Rechercher...',
  disabled = false,
  required = false,
  className = '',
  noOptionsMessage = 'Aucun résultat trouvé',
  searchPlaceholder = 'Tapez pour rechercher...',
  minSearchLength = 2,
  pageSize = 20,
  debounceMs = 300
}: AutocompletePaginatedProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<AutocompleteOption | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLLIElement>(null);

  // Debounce du terme de recherche
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  // Recherche avec pagination
  const performSearch = useCallback(async (term: string, page: number, append: boolean = false) => {
    if (term.length < minSearchLength && term.length > 0) return;
    
    setIsLoading(true);
    try {
      const result = await onSearch(term, page);
      
      if (append) {
        setOptions(prev => [...prev, ...result.data]);
      } else {
        setOptions(result.data);
        setHighlightedIndex(-1);
      }
      
      setHasMore(result.hasMore);
      setTotal(result.total);
      setCurrentPage(page);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      if (!append) {
        setOptions([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [onSearch, minSearchLength]);

  // Effet pour la recherche avec debounce
  useEffect(() => {
    if (isOpen) {
      performSearch(debouncedSearchTerm, 1, false);
    }
  }, [debouncedSearchTerm, isOpen, performSearch]);

  // Charger plus de résultats
  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      performSearch(debouncedSearchTerm, currentPage + 1, true);
    }
  }, [hasMore, isLoading, debouncedSearchTerm, currentPage, performSearch]);

  // Observer pour le scroll infini
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  // Trouver l'option sélectionnée par valeur
  useEffect(() => {
    if (value && options.length > 0) {
      const found = options.find(option => option.value === value);
      if (found) {
        setSelectedOption(found);
      }
    } else if (!value) {
      setSelectedOption(null);
    }
  }, [value, options]);

  // Fermer la liste quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Gérer la navigation au clavier
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : options.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && options[highlightedIndex]) {
            handleSelect(options[highlightedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, highlightedIndex, options]);

  // Scroll vers l'élément surligné
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
      setSearchTerm('');
      // Charger les résultats initiaux si pas encore fait
      if (options.length === 0) {
        performSearch('', 1, false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setHighlightedIndex(-1);
    
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleSelect = (option: AutocompleteOption) => {
    setSelectedOption(option);
    onChange(option.value, option);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOption(null);
    onChange('');
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const displayValue = isOpen ? searchTerm : (selectedOption?.label || '');
  const showResults = isOpen && (searchTerm.length >= minSearchLength || searchTerm.length === 0);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onClick={handleInputClick}
          placeholder={selectedOption ? selectedOption.label : placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg 
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm 
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${selectedOption && !isOpen ? 'text-gray-900 dark:text-white' : ''}
          `}
          autoComplete="off"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
          {isLoading && (
            <LoadingIcon className="h-4 w-4 text-blue-500" />
          )}
          {selectedOption && !disabled && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
          <ChevronDownIcon 
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </div>

      {showResults && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
          {/* Message de recherche minimale */}
          {searchTerm.length > 0 && searchTerm.length < minSearchLength && (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              Tapez au moins {minSearchLength} caractères pour rechercher...
            </div>
          )}

          {/* Résultats */}
          {(searchTerm.length >= minSearchLength || searchTerm.length === 0) && (
            <>
              {options.length > 0 ? (
                <ul ref={listRef} className="py-1">
                  {options.map((option, index) => (
                    <li
                      key={`${option.value}-${index}`}
                      onClick={() => handleSelect(option)}
                      className={`
                        px-3 py-2 cursor-pointer text-sm
                        ${index === highlightedIndex 
                          ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100' 
                          : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      <div className="font-medium">{option.label}</div>
                      {option.subtitle && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {option.subtitle}
                        </div>
                      )}
                    </li>
                  ))}
                  
                  {/* Indicateur de chargement pour plus de résultats */}
                  {hasMore && (
                    <li ref={loadMoreRef} className="px-3 py-2 text-center">
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <LoadingIcon className="h-4 w-4" />
                          Chargement...
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          Faites défiler pour voir plus de résultats...
                        </div>
                      )}
                    </li>
                  )}
                </ul>
              ) : !isLoading ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? noOptionsMessage : searchPlaceholder}
                </div>
              ) : (
                <div className="px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <LoadingIcon className="h-4 w-4" />
                    Recherche en cours...
                  </div>
                </div>
              )}

              {/* Compteur de résultats */}
              {total > 0 && !isLoading && (
                <div className="px-3 py-1 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {options.length} sur {total} résultat{total > 1 ? 's' : ''}
                    {hasMore && ' (faites défiler pour plus)'}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}