'use client';

import { useLang } from '@/lib/utils/LanguageContext';
import { Search, BarChart3, ShoppingBag, CheckCircle2 } from 'lucide-react';

export default function HowItWorks() {
  const { t } = useLang();

  const STEPS = [
    {
      icon: <Search className="h-7 w-7" />,
      titleKey: 'how.step1.title',
      descKey: 'how.step1.desc',
      color: 'bg-[#FDF7F2]',
      iconColor: 'text-orange-500',
    },
    {
      icon: <BarChart3 className="h-7 w-7" />,
      titleKey: 'how.step2.title',
      descKey: 'how.step2.desc',
      color: 'bg-[#F5F9F5]',
      iconColor: 'text-emerald-500',
    },
    {
      icon: <ShoppingBag className="h-7 w-7" />,
      titleKey: 'how.step3.title',
      descKey: 'how.step3.desc',
      color: 'bg-[#F7F7FF]',
      iconColor: 'text-blue-500',
    },
    {
      icon: <CheckCircle2 className="h-7 w-7" />,
      titleKey: 'how.step4.title',
      descKey: 'how.step4.desc',
      color: 'bg-[#FFFDF0]',
      iconColor: 'text-amber-500',
    },
  ];

  return (
    <section className="py-24 bg-white border-y border-masala-border relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-masala-primary/10 text-[11px] font-black uppercase tracking-[0.2em] text-masala-primary mb-4">
            {t('how.title')}
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-masala-text" style={{ fontFamily: 'Fraunces, serif' }}>
            {t('how.subtitle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((step, i) => (
            <div key={i} className="group relative flex flex-col items-center text-center">
              <div className={`w-20 h-20 rounded-[2rem] ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm`}>
                <div className={step.iconColor}>{step.icon}</div>
              </div>
              <h3 className="text-xl font-black text-masala-text mb-3">{t(step.titleKey)}</h3>
              <p className="text-masala-text-muted text-sm leading-relaxed max-w-[240px]">
                {t(step.descKey)}
              </p>
              
              {/* Connector for desktop */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-masala-border to-transparent -z-10" />
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-masala-primary/5 blur-[100px] rounded-full -translate-y-1/2 -z-0" />
      <div className="absolute top-1/2 right-0 w-64 h-64 bg-masala-accent/5 blur-[100px] rounded-full -translate-y-1/2 -z-0" />
    </section>
  );
}
