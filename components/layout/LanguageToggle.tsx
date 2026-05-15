'use client';

import { useLang } from '@/lib/utils/LanguageContext';

export default function LanguageToggle() {
    const { lang, setLang } = useLang();
    const isEN = lang === 'en';

    return (
        <button
            onClick={() => setLang(isEN ? 'de' : 'en')}
            aria-label="Toggle language"
            className="relative flex items-center h-7 w-[68px] rounded-full bg-masala-text/90 hover:bg-masala-text transition-colors duration-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-masala-primary/50 flex-shrink-0"
        >
            {/* Sliding pill */}
            <span
                className={`absolute top-[3px] h-[22px] w-[28px] rounded-full bg-white shadow-md transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isEN ? 'left-[3px]' : 'left-[37px]'
                    }`}
            />
            {/* EN label */}
            <span
                className={`relative z-10 flex-1 text-center text-[10px] font-black tracking-wider transition-colors duration-200 ${isEN ? 'text-masala-text' : 'text-white/70'}`}
            >
                EN
            </span>
            {/* DE label */}
            <span
                className={`relative z-10 flex-1 text-center text-[10px] font-black tracking-wider transition-colors duration-200 ${!isEN ? 'text-masala-text' : 'text-white/70'}`}
            >
                DE
            </span>
        </button>
    );
}
