'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, LogIn } from 'lucide-react';

export default function ChatPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="bg-white rounded-2xl border border-brand-border p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-primary-light text-primary mx-auto flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-brand-text mb-2">
            {t('nav.messages')}
          </h1>
          <p className="text-sm text-brand-muted mb-6">
            {t('auth.login_required_desc')}
          </p>
          <Link
            href="/login?next=/chat"
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
      <h1 className="text-2xl font-bold text-brand-text">
        {t('nav.messages')}
      </h1>

      <div className="bg-white rounded-2xl border border-brand-border p-8 text-center space-y-3 shadow-xs">
        <div className="w-14 h-14 rounded-full bg-brand-bg text-brand-muted mx-auto flex items-center justify-center">
          <MessageSquare className="w-7 h-7 text-primary/60" />
        </div>
        <h2 className="text-base font-bold text-brand-text">
          {language === 'ne' ? 'कुनै सन्देश छैन' : 'No messages yet'}
        </h2>
        <p className="text-xs sm:text-sm text-brand-muted max-w-sm mx-auto">
          {language === 'ne'
            ? 'जब तपाईं काममा आवेदन दिनुहुन्छ वा कसैले तपाईंको काममा आवेदन दिन्छ, तपाईं यहाँ कुराकानी गर्न सक्नुहुन्छ।'
            : 'When you apply for a job or an employer responds, conversations will appear here in real time.'}
        </p>
      </div>
    </div>
  );
}
