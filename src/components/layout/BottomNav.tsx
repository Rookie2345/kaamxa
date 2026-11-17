'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Search, Briefcase, MessageSquare, User, PlusCircle } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    {
      href: '/',
      label: t('nav.home'),
      icon: Search,
      isActive: pathname === '/',
    },
    {
      href: '/my-jobs',
      label: t('nav.my_jobs'),
      icon: Briefcase,
      isActive: pathname.startsWith('/my-jobs') || pathname.startsWith('/applications'),
    },
    {
      href: '/jobs/new',
      label: t('nav.post_job'),
      icon: PlusCircle,
      isSpecial: true,
      isActive: pathname === '/jobs/new',
    },
    {
      href: '/chat',
      label: t('nav.messages'),
      icon: MessageSquare,
      isActive: pathname.startsWith('/chat'),
    },
    {
      href: '/profile',
      label: t('nav.profile'),
      icon: User,
      isActive: pathname.startsWith('/profile') || pathname.startsWith('/login'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-border sm:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 h-16 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-4 touch-manipulation group"
              >
                <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-md active:scale-90 transition-transform group-hover:bg-accent-hover">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-accent mt-0.5 tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center h-full w-full py-1 touch-manipulation transition-colors ${
                item.isActive
                  ? 'text-primary font-bold'
                  : 'text-brand-muted hover:text-brand-text font-normal'
              }`}
            >
              <Icon className={`w-5 h-5 ${item.isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[11px] mt-1 tracking-tight truncate max-w-[64px] text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
