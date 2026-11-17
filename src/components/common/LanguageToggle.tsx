'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Globe } from 'lucide-react';

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      type="button"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-border bg-white text-sm font-medium text-brand-text hover:bg-gray-50 active:scale-95 transition-all shadow-sm min-h-[40px] touch-manipulation ${className}`}
      aria-label="Toggle Language"
    >
      <Globe className="w-4 h-4 text-primary" />
      <span className="font-semibold text-xs tracking-wider">
        {language === 'ne' ? 'EN' : 'नेपाली'}
      </span>
    </button>
  );
}
