'use client';

import { useState, useRef, useEffect } from 'react';
import { CURRENCIES, POPULAR_CURRENCIES, CURRENCIES_BY_REGION, getCurrencyByCode, searchCurrencies, Currency } from '@/lib/currencies';

interface CurrencySelectorProps {
  value: string;
  onChange: (currencyCode: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  showPopular?: boolean;
  showRegions?: boolean;
}

export default function CurrencySelector({
  value,
  onChange,
  placeholder = 'Sélectionner une devise',
  className = '',
  disabled = false,
  required = false,
  showPopular = true,
  showRegions = true,
}: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCurrencies, setFilteredCurrencies] = useState<Currency[]>(CURRENCIES);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCurrency = getCurrencyByCode(value);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrer les devises selon le terme de recherche
  useEffect(() => {
    const filtered = searchCurrencies(searchTerm);
    setFilteredCurrencies(filtered);
  }, [searchTerm]);

  const handleSelect = (currencyCode: string) => {
    onChange(currencyCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Enter' && filteredCurrencies.length > 0) {
      e.preventDefault();
      handleSelect(filteredCurrencies[0].code);
    }
  };

  // Devises populaires filtrées
  const popularCurrencies = POPULAR_CURRENCIES
    .map(code => getCurrencyByCode(code))
    .filter((currency): currency is Currency => 
      currency !== undefined && 
      filteredCurrencies.some(c => c.code === currency.code)
    );

  // Grouper les devises filtrées par région
  const filteredByRegion = Object.entries(CURRENCIES_BY_REGION).reduce((acc, [region, currencies]) => {
    const filtered = currencies.filter(currency => 
      filteredCurrencies.some(c => c.code === currency.code)
    );
    if (filtered.length > 0) {
      acc[region] = filtered;
    }
    return acc;
  }, {} as Record<string, Currency[]>);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input principal */}
      <div
        onClick={handleInputClick}
        className={`
          w-full px-3 py-2 border rounded-lg cursor-pointer transition-colors
          ${disabled 
            ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 cursor-not-allowed' 
            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedCurrency ? (
              <>
                <span className="text-lg">{selectedCurrency.flag}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedCurrency.code}
                </span>
                <span className="text-gray-600 dark:text-gray-400 truncate">
                  {selectedCurrency.name}
                </span>
                <span className="text-gray-500 dark:text-gray-500 ml-auto">
                  {selectedCurrency.symbol}
                </span>
              </>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
            {required && !value && (
              <span className="text-red-500 text-sm">*</span>
            )}
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Barre de recherche */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher une devise..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="max-h-80 overflow-y-auto">
            {/* Devises populaires */}
            {showPopular && popularCurrencies.length > 0 && !searchTerm && (
              <div className="p-2">
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Devises populaires
                </div>
                {popularCurrencies.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => handleSelect(currency.code)}
                    className={`
                      w-full px-3 py-2 text-left rounded-md transition-colors flex items-center gap-3
                      ${value === currency.code 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                      }
                    `}
                  >
                    <span className="text-lg">{currency.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{currency.code}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {currency.name}
                        </span>
                      </div>
                    </div>
                    <span className="text-gray-500 dark:text-gray-500 text-sm">
                      {currency.symbol}
                    </span>
                  </button>
                ))}
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
              </div>
            )}

            {/* Devises par région */}
            {showRegions ? (
              Object.entries(filteredByRegion).map(([region, currencies]) => (
                <div key={region} className="p-2">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {region}
                  </div>
                  {currencies.map((currency) => (
                    <button
                      key={currency.code}
                      onClick={() => handleSelect(currency.code)}
                      className={`
                        w-full px-3 py-2 text-left rounded-md transition-colors flex items-center gap-3
                        ${value === currency.code 
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                        }
                      `}
                    >
                      <span className="text-lg">{currency.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{currency.code}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {currency.name}
                          </span>
                        </div>
                      </div>
                      <span className="text-gray-500 dark:text-gray-500 text-sm">
                        {currency.symbol}
                      </span>
                    </button>
                  ))}
                </div>
              ))
            ) : (
              // Liste simple si pas de regroupement
              <div className="p-2">
                {filteredCurrencies.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => handleSelect(currency.code)}
                    className={`
                      w-full px-3 py-2 text-left rounded-md transition-colors flex items-center gap-3
                      ${value === currency.code 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                      }
                    `}
                  >
                    <span className="text-lg">{currency.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{currency.code}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {currency.name}
                        </span>
                      </div>
                    </div>
                    <span className="text-gray-500 dark:text-gray-500 text-sm">
                      {currency.symbol}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Aucun résultat */}
            {filteredCurrencies.length === 0 && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <div className="text-2xl mb-2">🔍</div>
                <p className="text-sm">Aucune devise trouvée</p>
                <p className="text-xs mt-1">Essayez avec un autre terme de recherche</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}