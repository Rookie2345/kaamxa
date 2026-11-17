'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { PlusCircle, LogIn, ArrowLeft } from 'lucide-react';

export default function PostJobPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="bg-white rounded-2xl border border-brand-border p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-primary-light text-primary mx-auto flex items-center justify-center mb-4">
            <PlusCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-brand-text mb-2">
            {t('nav.post_job')}
          </h1>
          <p className="text-sm text-brand-muted mb-6">
            {t('auth.login_required_desc')}
          </p>
          <Link
            href="/login?next=/jobs/new"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-accent text-white font-bold text-sm shadow-sm hover:bg-accent-hover active:scale-95 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>{t('nav.login')}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('common.back')}</span>
      </Link>

      <div className="bg-white rounded-2xl border border-brand-border p-6 sm:p-8 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary-light text-primary mx-auto flex items-center justify-center">
          <PlusCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-brand-text">
          {t('nav.post_job')}
        </h1>
        <p className="text-sm text-brand-muted max-w-md mx-auto">
          {language === 'ne'
            ? 'काम पोष्ट गर्ने फारम र स्क्रिनिङ प्रश्न निर्माता दोस्रो चरण (Phase 2) मा उपलब्ध हुनेछ।'
            : 'The job posting form and screening questions builder will be fully active in Phase 2.'}
        </p>

        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium max-w-md mx-auto">
          {t('common.safety_warning')}
        </div>
      </div>
    </div>
  );
}
