'use client';

import { useLang } from '@/lib/utils/LanguageContext';

interface LanguageToggleProps {
  size?: 'compact' | 'default';
}

export default function LanguageToggle({ size = 'default' }: LanguageToggleProps) {
  const { lang, setLang } = useLang();
  const isEN = lang === 'en';
  const isCompact = size === 'compact';

  if (isCompact) {
    // Compact pill: sits right next to logo
    return (
      <div className="flex items-center h-7 w-[68px] rounded-full border border-masala-border bg-white p-0.5 flex-shrink-0">
        {(['en', 'de'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            aria-label={`Switch to ${l.toUpperCase()}`}
            className={`flex-1 h-full rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
              lang === l
                ? 'bg-masala-primary text-white shadow-sm'
                : 'text-masala-text/50 hover:text-masala-text'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  // Default sliding-pill toggle (used in mobile menu / right-side header)
  return (
    <button
      onClick={() => setLang(isEN ? 'de' : 'en')}
      aria-label="Toggle language"
      className="relative flex items-center h-7 w-[68px] rounded-full bg-masala-text/90 hover:bg-masala-text transition-colors duration-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-masala-primary/50 flex-shrink-0"
    >
      {/* Sliding pill */}
      <span
        className={`absolute top-[3px] h-[22px] w-[28px] rounded-full bg-white shadow-md transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isEN ? 'left-[3px]' : 'left-[37px]'
        }`}
      />
      {/* EN label */}
      <span
        className={`relative z-10 flex-1 text-center text-[10px] font-black tracking-wider transition-colors duration-200 ${
          isEN ? 'text-masala-text' : 'text-white/70'
        }`}
      >
        EN
      </span>
      {/* DE label */}
      <span
        className={`relative z-10 flex-1 text-center text-[10px] font-black tracking-wider transition-colors duration-200 ${
          !isEN ? 'text-masala-text' : 'text-white/70'
        }`}
      >
        DE
      </span>
    </button>
  );
}
