'use client';
import { useLang } from '@/lib/utils/LanguageContext';

export default function LanguageToggle({ size = 'default' }: { size?: 'compact' | 'default' }) {
  const { lang, setLang } = useLang();
  
  const isCompact = size === 'compact';
  
  return (
    <div className={`flex items-center rounded-full border border-masala-border bg-white p-0.5 ${
      isCompact ? 'h-7 w-[68px]' : 'h-9 w-[88px]'
    }`}>
      {(['en', 'de'] as const).map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`flex-1 rounded-full transition-all font-black uppercase tracking-wide ${
            isCompact ? 'text-[10px] h-5' : 'text-xs h-7'
          } ${
            lang === l 
              ? 'bg-masala-primary text-white shadow-sm' 
              : 'text-masala-text-muted hover:text-masala-text'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
