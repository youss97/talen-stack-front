// Bibliothèque complète des devises mondiales
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  region: string;
}

export const CURRENCIES: Currency[] = [
  // Devises principales (Europe)
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', region: 'Europe' },
  { code: 'CHF', name: 'Franc suisse', symbol: 'CHF', flag: '🇨🇭', region: 'Europe' },
  { code: 'GBP', name: 'Livre sterling', symbol: '£', flag: '🇬🇧', region: 'Europe' },
  { code: 'NOK', name: 'Couronne norvégienne', symbol: 'kr', flag: '🇳🇴', region: 'Europe' },
  { code: 'SEK', name: 'Couronne suédoise', symbol: 'kr', flag: '🇸🇪', region: 'Europe' },
  { code: 'DKK', name: 'Couronne danoise', symbol: 'kr', flag: '🇩🇰', region: 'Europe' },
  { code: 'PLN', name: 'Złoty polonais', symbol: 'zł', flag: '🇵🇱', region: 'Europe' },
  { code: 'CZK', name: 'Couronne tchèque', symbol: 'Kč', flag: '🇨🇿', region: 'Europe' },
  { code: 'HUF', name: 'Forint hongrois', symbol: 'Ft', flag: '🇭🇺', region: 'Europe' },
  { code: 'RON', name: 'Leu roumain', symbol: 'lei', flag: '🇷🇴', region: 'Europe' },

  // Devises principales (Amérique du Nord)
  { code: 'USD', name: 'Dollar américain', symbol: '$', flag: '🇺🇸', region: 'Amérique du Nord' },
  { code: 'CAD', name: 'Dollar canadien', symbol: 'C$', flag: '🇨🇦', region: 'Amérique du Nord' },
  { code: 'MXN', name: 'Peso mexicain', symbol: '$', flag: '🇲🇽', region: 'Amérique du Nord' },

  // Devises principales (Asie-Pacifique)
  { code: 'JPY', name: 'Yen japonais', symbol: '¥', flag: '🇯🇵', region: 'Asie-Pacifique' },
  { code: 'CNY', name: 'Yuan chinois', symbol: '¥', flag: '🇨🇳', region: 'Asie-Pacifique' },
  { code: 'KRW', name: 'Won sud-coréen', symbol: '₩', flag: '🇰🇷', region: 'Asie-Pacifique' },
  { code: 'AUD', name: 'Dollar australien', symbol: 'A$', flag: '🇦🇺', region: 'Asie-Pacifique' },
  { code: 'NZD', name: 'Dollar néo-zélandais', symbol: 'NZ$', flag: '🇳🇿', region: 'Asie-Pacifique' },
  { code: 'SGD', name: 'Dollar de Singapour', symbol: 'S$', flag: '🇸🇬', region: 'Asie-Pacifique' },
  { code: 'HKD', name: 'Dollar de Hong Kong', symbol: 'HK$', flag: '🇭🇰', region: 'Asie-Pacifique' },
  { code: 'INR', name: 'Roupie indienne', symbol: '₹', flag: '🇮🇳', region: 'Asie-Pacifique' },
  { code: 'THB', name: 'Baht thaïlandais', symbol: '฿', flag: '🇹🇭', region: 'Asie-Pacifique' },
  { code: 'MYR', name: 'Ringgit malaisien', symbol: 'RM', flag: '🇲🇾', region: 'Asie-Pacifique' },
  { code: 'IDR', name: 'Roupie indonésienne', symbol: 'Rp', flag: '🇮🇩', region: 'Asie-Pacifique' },
  { code: 'PHP', name: 'Peso philippin', symbol: '₱', flag: '🇵🇭', region: 'Asie-Pacifique' },
  { code: 'VND', name: 'Dong vietnamien', symbol: '₫', flag: '🇻🇳', region: 'Asie-Pacifique' },

  // Moyen-Orient et Afrique
  { code: 'AED', name: 'Dirham des EAU', symbol: 'د.إ', flag: '🇦🇪', region: 'Moyen-Orient' },
  { code: 'SAR', name: 'Riyal saoudien', symbol: '﷼', flag: '🇸🇦', region: 'Moyen-Orient' },
  { code: 'QAR', name: 'Riyal qatarien', symbol: '﷼', flag: '🇶🇦', region: 'Moyen-Orient' },
  { code: 'KWD', name: 'Dinar koweïtien', symbol: 'د.ك', flag: '🇰🇼', region: 'Moyen-Orient' },
  { code: 'BHD', name: 'Dinar bahreïni', symbol: '.د.ب', flag: '🇧🇭', region: 'Moyen-Orient' },
  { code: 'OMR', name: 'Rial omanais', symbol: '﷼', flag: '🇴🇲', region: 'Moyen-Orient' },
  { code: 'ILS', name: 'Shekel israélien', symbol: '₪', flag: '🇮🇱', region: 'Moyen-Orient' },
  { code: 'TRY', name: 'Livre turque', symbol: '₺', flag: '🇹🇷', region: 'Moyen-Orient' },
  { code: 'EGP', name: 'Livre égyptienne', symbol: '£', flag: '🇪🇬', region: 'Afrique' },
  { code: 'ZAR', name: 'Rand sud-africain', symbol: 'R', flag: '🇿🇦', region: 'Afrique' },
  { code: 'NGN', name: 'Naira nigérian', symbol: '₦', flag: '🇳🇬', region: 'Afrique' },
  { code: 'KES', name: 'Shilling kényan', symbol: 'KSh', flag: '🇰🇪', region: 'Afrique' },
  { code: 'GHS', name: 'Cedi ghanéen', symbol: '₵', flag: '🇬🇭', region: 'Afrique' },
  { code: 'MAD', name: 'Dirham marocain', symbol: 'د.م.', flag: '🇲🇦', region: 'Afrique' },
  { code: 'TND', name: 'Dinar tunisien', symbol: 'د.ت', flag: '🇹🇳', region: 'Afrique' },
  { code: 'DZD', name: 'Dinar algérien', symbol: 'د.ج', flag: '🇩🇿', region: 'Afrique' },

  // Amérique du Sud
  { code: 'BRL', name: 'Réal brésilien', symbol: 'R$', flag: '🇧🇷', region: 'Amérique du Sud' },
  { code: 'ARS', name: 'Peso argentin', symbol: '$', flag: '🇦🇷', region: 'Amérique du Sud' },
  { code: 'CLP', name: 'Peso chilien', symbol: '$', flag: '🇨🇱', region: 'Amérique du Sud' },
  { code: 'COP', name: 'Peso colombien', symbol: '$', flag: '🇨🇴', region: 'Amérique du Sud' },
  { code: 'PEN', name: 'Sol péruvien', symbol: 'S/', flag: '🇵🇪', region: 'Amérique du Sud' },
  { code: 'UYU', name: 'Peso uruguayen', symbol: '$U', flag: '🇺🇾', region: 'Amérique du Sud' },
  { code: 'VES', name: 'Bolívar vénézuélien', symbol: 'Bs.S', flag: '🇻🇪', region: 'Amérique du Sud' },

  // Autres devises importantes
  { code: 'RUB', name: 'Rouble russe', symbol: '₽', flag: '🇷🇺', region: 'Europe de l\'Est' },
  { code: 'UAH', name: 'Hryvnia ukrainienne', symbol: '₴', flag: '🇺🇦', region: 'Europe de l\'Est' },
  { code: 'BYN', name: 'Rouble biélorusse', symbol: 'Br', flag: '🇧🇾', region: 'Europe de l\'Est' },
  { code: 'KZT', name: 'Tenge kazakh', symbol: '₸', flag: '🇰🇿', region: 'Asie centrale' },
  { code: 'UZS', name: 'Sum ouzbek', symbol: 'лв', flag: '🇺🇿', region: 'Asie centrale' },
];

// Devises les plus utilisées (pour affichage prioritaire)
export const POPULAR_CURRENCIES = [
  'EUR', 'USD', 'GBP', 'CHF', 'CAD', 'JPY', 'AUD', 'CNY', 'SEK', 'NOK', 'DKK'
];

// Grouper les devises par région
export const CURRENCIES_BY_REGION = CURRENCIES.reduce((acc, currency) => {
  if (!acc[currency.region]) {
    acc[currency.region] = [];
  }
  acc[currency.region].push(currency);
  return acc;
}, {} as Record<string, Currency[]>);

// Fonction pour obtenir une devise par code
export const getCurrencyByCode = (code: string): Currency | undefined => {
  return CURRENCIES.find(currency => currency.code === code);
};

// Fonction pour formater un montant avec la devise
export const formatCurrency = (amount: number, currencyCode: string, locale: string = 'fr-FR'): string => {
  const currency = getCurrencyByCode(currencyCode);
  if (!currency) return `${amount} ${currencyCode}`;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch (error) {
    // Fallback si la devise n'est pas supportée par Intl
    return `${currency.symbol}${amount.toLocaleString(locale)}`;
  }
};

// Fonction pour rechercher des devises
export const searchCurrencies = (query: string): Currency[] => {
  if (!query.trim()) return CURRENCIES;
  
  const searchTerm = query.toLowerCase();
  return CURRENCIES.filter(currency => 
    currency.code.toLowerCase().includes(searchTerm) ||
    currency.name.toLowerCase().includes(searchTerm) ||
    currency.region.toLowerCase().includes(searchTerm)
  );
};