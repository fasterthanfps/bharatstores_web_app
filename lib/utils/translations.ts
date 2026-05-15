// ── Translation System ────────────────────────────────────────────────────────
// Supports English (en) and German (de) for BharatStores.eu

export type Lang = 'en' | 'de';

export const translations = {
  en: {
    // Header
    searchPlaceholder: 'Search for products...',
    searchButton: 'Search',
    blog: 'Blog',
    priceAlert: 'Price Alert',
    account: 'Account',

    // Hero
    badge: 'Prices just updated · 3 shops compared',
    heroTitle1: 'One search.',
    heroTitle2: 'Every Indian store.',
    heroSubtitle: 'Compare prices for Basmati rice, Ghee, Masala & more at',
    heroSubtitleEnd: '– at lightning speed.',

    // Popular
    popularSearches: 'Popular Searches',
    popularCategories: 'Popular Categories',

    // Search page
    searching: 'Searching...',
    exactMatches: 'Exact Matches',
    relatedProducts: 'Related Products',
    noResults: 'No results found',
    noResultsDesc: 'Try a different search term or browse categories below.',
    resultsFor: 'Results for',
    sortBy: 'Sort by',
    price: 'Price',
    pricePerKg: 'Price / kg',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    buyNow: 'Buy Now',
    cheapest: 'Cheapest',
    freshPrices: 'Fresh prices',
    cachedPrices: 'Cached prices',
    updating: 'Updating...',

    // Categories
    basmatiRice: 'Basmati Rice',
    ghee: 'Amul Ghee',
    spices: 'MDH Masala',
    toorDal: 'Toor Dal',
    chai: 'Chai Tea',
    atta: 'Atta Flour',
    snacks: 'Snacks',
    paneer: 'Paneer',

    // Store section
    storesWeCompare: 'We compare these stores for you',

    // Features
    whyTitle: 'Why',
    feature1Title: 'Best Price Finder',
    feature1Desc: 'We compare all major Indian stores in Germany and show you the best price.',
    feature2Title: 'Always Fresh',
    feature2Desc: 'Prices auto-update every 6 hours – you always see today\'s prices.',
    feature3Title: 'Free & Transparent',
    feature3Desc: 'BharatStores is free. We earn a small commission when you buy – no extra cost to you.',

    // CTA
    ctaTitle: 'Compare Prices Now',
    ctaDesc: 'Save an average of 15–30% on your next Indian grocery shop.',
    ctaButton: 'Start Comparing',

    // Footer
    footerTagline: 'The #1 price comparison for Indians in Europe.',
    footerLinks: 'Useful Links',
  },
  de: {
    // Header
    searchPlaceholder: 'Produkte suchen...',
    searchButton: 'Suchen',
    blog: 'Blog',
    priceAlert: 'Preisalarm',
    account: 'Konto',

    // Hero
    badge: 'Preise gerade aktualisiert · 3 Shops verglichen',
    heroTitle1: 'Eine Suche.',
    heroTitle2: 'Jeder indische Shop.',
    heroSubtitle: 'Vergleiche Preise für Basmati Reis, Ghee, Masala & mehr bei',
    heroSubtitleEnd: '– in Lichtgeschwindigkeit.',

    // Popular
    popularSearches: 'Beliebte Suchen',
    popularCategories: 'Beliebte Kategorien',

    // Search page
    searching: 'Suche läuft...',
    exactMatches: 'Genaue Treffer',
    relatedProducts: 'Ähnliche Produkte',
    noResults: 'Keine Ergebnisse gefunden',
    noResultsDesc: 'Versuche einen anderen Suchbegriff oder durchstöbere die Kategorien unten.',
    resultsFor: 'Ergebnisse für',
    sortBy: 'Sortieren nach',
    price: 'Preis',
    pricePerKg: 'Preis / kg',
    inStock: 'Vorrätig',
    outOfStock: 'Nicht vorrätig',
    buyNow: 'Jetzt kaufen',
    cheapest: 'Günstigster',
    freshPrices: 'Aktuelle Preise',
    cachedPrices: 'Gespeicherte Preise',
    updating: 'Wird aktualisiert...',

    // Categories
    basmatiRice: 'Basmati Reis',
    ghee: 'Amul Ghee',
    spices: 'MDH Masala',
    toorDal: 'Toor Dal',
    chai: 'Chai Tee',
    atta: 'Atta Mehl',
    snacks: 'Snacks',
    paneer: 'Paneer',

    // Store section
    storesWeCompare: 'Wir vergleichen diese Shops für dich',

    // Features
    whyTitle: 'Warum',
    feature1Title: 'Günstigsten Preis finden',
    feature1Desc: 'Wir vergleichen alle großen deutschen Indienläden und zeigen dir den besten Preis.',
    feature2Title: 'Immer aktuell',
    feature2Desc: 'Preise werden alle 6 Stunden automatisch aktualisiert – du siehst immer tagesaktuelle Preise.',
    feature3Title: 'Kostenlos & transparent',
    feature3Desc: 'BharatStores ist kostenlos. Wir verdienen eine kleine Provision wenn du kaufst – ohne Aufpreis für dich.',

    // CTA
    ctaTitle: 'Jetzt Preise vergleichen',
    ctaDesc: 'Spare durchschnittlich 15–30% bei deinem nächsten indischen Einkauf.',
    ctaButton: 'Preisvergleich starten',

    // Footer
    footerTagline: 'Der #1 Preisvergleich für Inder in Europa.',
    footerLinks: 'Nützliche Links',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
