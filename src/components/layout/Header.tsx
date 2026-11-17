'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { User as UserIcon, PlusCircle } from 'lucide-react';

export function Header() {
  const { t } = useLanguage();
  const { user, profile } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-brand-border">
      <div className="max-w-5xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand Wordmark */}
        <Link href="/" className="flex items-center gap-2 group touch-manipulation">
          <div className="flex items-baseline">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-primary">
              Kaam<span className="text-accent font-black">X</span>a
            </span>
          </div>
          <span className="hidden xs:inline-block text-[11px] font-bold bg-primary-light text-primary px-2 py-0.5 rounded-full border border-primary/20">
            काम छ
          </span>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Post Job button for desktop & tablets */}
          <Link
            href="/jobs/new"
            className="hidden sm:inline-flex items-center gap-1.5 bg-primary text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-primary-hover active:scale-95 transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('nav.post_job')}</span>
          </Link>

          {/* Language Switcher */}
          <LanguageToggle />

          {/* Auth status / Profile button */}
          {user ? (
            <Link
              href="/profile"
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-light text-primary font-bold border border-primary/30 hover:bg-primary/20 transition-all touch-manipulation"
              title={profile?.full_name || 'Profile'}
            >
              {profile?.full_name ? (
                profile.full_name.slice(0, 1).toUpperCase()
              ) : (
                <UserIcon className="w-5 h-5 text-primary" />
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center min-h-[40px] px-3.5 py-1.5 text-sm font-semibold rounded-lg bg-accent text-white hover:bg-accent-hover active:scale-95 transition-all shadow-sm touch-manipulation"
            >
              {t('nav.login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
