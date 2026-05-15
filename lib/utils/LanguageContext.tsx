'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '@/lib/i18n/en';
import de from '@/lib/i18n/de';

export type Lang = 'en' | 'de';

const translations: Record<Lang, Record<string, string>> = { en, de };

interface LanguageContextType {
    lang: Lang;
    setLang: (lang: Lang) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
    lang: 'en',
    setLang: () => {},
    t: (key) => en[key] ?? key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Lang>('en');

    useEffect(() => {
        const saved = localStorage.getItem('bs-lang') as Lang | null;
        if (saved === 'en' || saved === 'de') setLangState(saved);
    }, []);

    const setLang = (l: Lang) => {
        setLangState(l);
        localStorage.setItem('bs-lang', l);
        if (typeof document !== 'undefined') {
            document.documentElement.lang = l;
        }
    };

    const t = (key: string): string => translations[lang][key] ?? translations['en'][key] ?? key;

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLang() {
    return useContext(LanguageContext);
}

// Legacy alias for components using useLang from contexts/LanguageContext
export { LanguageContext };
