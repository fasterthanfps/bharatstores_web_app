// lib/stores.ts — Centralized store configuration (colors, initials, labels)

export interface StoreConfig {
  label: string;
  initials: string;
  color: string;       // background color (light)
  textColor: string;   // text/icon color
  borderColor?: string;
}

export const STORE_CONFIG: Record<string, StoreConfig> = {
  dookan:       { label: 'Dookan',        initials: 'DO', color: '#DBEAFE', textColor: '#1D4ED8' },
  jamoona:      { label: 'Jamoona',       initials: 'JA', color: '#FEF9C3', textColor: '#854D0E' },
  swadesh:      { label: 'Swadesh',       initials: 'SW', color: '#DCFCE7', textColor: '#166534' },
  nammamarkt:   { label: 'Namma Markt',   initials: 'NM', color: '#EDE9FE', textColor: '#5B21B6' },
  angaadi:      { label: 'Angaadi',       initials: 'AN', color: '#FFE4E6', textColor: '#9F1239' },
  littleindia:  { label: 'Little India',  initials: 'LI', color: '#FEF3C7', textColor: '#92400E' },
  spicevillage: { label: 'Spice Village', initials: 'SV', color: '#ECFDF5', textColor: '#065F46' },
  grocera:      { label: 'Grocera',       initials: 'GR', color: '#F0FDF4', textColor: '#14532D' },
  'little india': { label: 'Little India', initials: 'LI', color: '#FEF3C7', textColor: '#92400E' },
  'spice village': { label: 'Spice Village', initials: 'SV', color: '#ECFDF5', textColor: '#065F46' },
  'namma markt': { label: 'Namma Markt', initials: 'NM', color: '#EDE9FE', textColor: '#5B21B6' },
};

/**
 * Get store config by slug or display name.
 * Falls back to initials from the name and neutral colors.
 */
export function getStoreConfig(slugOrName: string): StoreConfig {
  const key = slugOrName.toLowerCase().replace(/\s+/g, '');
  // Try exact key
  if (STORE_CONFIG[key]) return STORE_CONFIG[key];
  // Try with spaces
  const keySpaced = slugOrName.toLowerCase();
  if (STORE_CONFIG[keySpaced]) return STORE_CONFIG[keySpaced];
  // Partial match
  for (const [k, v] of Object.entries(STORE_CONFIG)) {
    if (keySpaced.includes(k) || k.includes(keySpaced.split(' ')[0])) return v;
  }
  // Fallback
  return {
    label: slugOrName,
    initials: slugOrName.slice(0, 2).toUpperCase(),
    color: '#F3F4F6',
    textColor: '#374151',
  };
}

/** All stores in display order */
export const ALL_STORES = [
  { id: 'dookan',       label: 'Dookan' },
  { id: 'jamoona',      label: 'Jamoona' },
  { id: 'swadesh',      label: 'Swadesh' },
  { id: 'nammamarkt',   label: 'Namma Markt' },
  { id: 'angaadi',      label: 'Angaadi' },
  { id: 'littleindia',  label: 'Little India' },
  { id: 'spicevillage', label: 'Spice Village' },
  { id: 'grocera',      label: 'Grocera' },
];
