'use client';
import { useLang } from '@/lib/utils/LanguageContext';
import Logo from '@/components/ui/Logo';

export default function Footer() {
  const { t } = useLang();
  
  return (
    <footer className="bg-masala-bg border-t border-masala-border py-16">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-start gap-10">
        
        {/* Brand column */}
        <div className="space-y-4">
          <Logo />
          <p className="text-sm text-masala-text-muted leading-relaxed max-w-sm">
            {t('footer.tagline')}
          </p>
        </div>

        {/* Legal */}
        <div className="space-y-4 min-w-[200px]">
          <h4 className="font-black uppercase tracking-widest text-xs text-masala-text-muted">
            {t('footer.legal')}
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <a href="/impressum" className="text-masala-text hover:text-masala-primary transition-colors font-medium">
                {t('footer.imprint')}
              </a>
            </li>
            <li>
              <a href="/datenschutz" className="text-masala-text hover:text-masala-primary transition-colors font-medium">
                {t('footer.privacy')}
              </a>
            </li>
            <li>
              <a href="/terms" className="text-masala-text hover:text-masala-primary transition-colors font-medium">
                Terms &amp; Conditions
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-masala-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-masala-text-muted">
        <span>© {new Date().getFullYear()} BHARATSTORES.EU</span>
        <span>{t('footer.designedWith')} 🇩🇪</span>
      </div>
    </footer>
  );
}
