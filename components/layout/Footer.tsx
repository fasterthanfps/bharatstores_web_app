'use client';
import { useLang } from '@/lib/utils/LanguageContext';
import Logo from '@/components/ui/Logo';

export default function Footer() {
  const { t } = useLang();
  
  return (
    <footer className="bg-masala-bg border-t border-masala-border py-12">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Brand column */}
        <div>
          <Logo />
          <p className="mt-3 text-sm text-masala-text-muted leading-relaxed max-w-xs">
            {t('footer.tagline')}
          </p>
        </div>

        {/* Partner Shops */}
        <div>
          <h4 className="font-black uppercase tracking-widest text-xs text-masala-text-muted mb-4">
            {t('footer.partnerShops')}
          </h4>
          <ul className="space-y-2 text-sm">
            {['Grocera','Jamoona','Little India','Namma Markt','Dookan','Swadesh'].map(store => (
              <li key={store}>
                <span className="text-masala-text hover:text-masala-primary transition-colors cursor-default">
                  {store}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-black uppercase tracking-widest text-xs text-masala-text-muted mb-4">
            {t('footer.legal')}
          </h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/impressum" className="text-masala-text hover:text-masala-primary transition-colors">{t('footer.imprint')}</a></li>
            <li><a href="/datenschutz" className="text-masala-text hover:text-masala-primary transition-colors">{t('footer.privacy')}</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-masala-border flex items-center justify-between text-xs text-masala-text-muted">
        <span>© {new Date().getFullYear()} BHARATSTORES.EU</span>
        <span>{t('footer.designedWith')} 🇩🇪</span>
      </div>
    </footer>
  );
}
