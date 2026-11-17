'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { formatDualDate } from '@/lib/utils/date';
import {
  Search,
  PlusCircle,
  Briefcase,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  Zap,
  Wrench,
  Hammer,
  Paintbrush,
  Scissors,
  Car,
  Utensils,
  UserCheck,
  Truck,
  BookOpen,
  Laptop,
} from 'lucide-react';

const TRADE_ICONS: Record<string, React.ReactNode> = {
  electrician: <Zap className="w-5 h-5 text-amber-500" />,
  plumber: <Wrench className="w-5 h-5 text-blue-500" />,
  carpenter: <Hammer className="w-5 h-5 text-amber-700" />,
  mason: <Hammer className="w-5 h-5 text-stone-600" />,
  painter: <Paintbrush className="w-5 h-5 text-purple-500" />,
  welder: <Zap className="w-5 h-5 text-orange-500" />,
  tailor: <Scissors className="w-5 h-5 text-pink-500" />,
  driver: <Car className="w-5 h-5 text-indigo-500" />,
  cook: <Utensils className="w-5 h-5 text-red-500" />,
  helper: <UserCheck className="w-5 h-5 text-emerald-600" />,
  'farm-worker': <UserCheck className="w-5 h-5 text-green-700" />,
  mechanic: <Wrench className="w-5 h-5 text-cyan-600" />,
  'shop-assistant': <Briefcase className="w-5 h-5 text-teal-600" />,
  'security-guard': <ShieldCheck className="w-5 h-5 text-blue-700" />,
  cleaner: <Sparkles className="w-5 h-5 text-sky-500" />,
  'delivery-rider': <Truck className="w-5 h-5 text-orange-600" />,
  tutor: <BookOpen className="w-5 h-5 text-violet-600" />,
  'data-entry': <Laptop className="w-5 h-5 text-slate-600" />,
};

const TRADES_LIST = [
  'electrician',
  'plumber',
  'carpenter',
  'mason',
  'painter',
  'welder',
  'tailor',
  'driver',
  'cook',
  'helper',
  'farm-worker',
  'mechanic',
  'shop-assistant',
  'security-guard',
  'cleaner',
  'delivery-rider',
  'tutor',
  'data-entry',
];

export default function HomePage() {
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const currentDate = new Date();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Date & Location Pill */}
      <div className="flex items-center justify-between text-xs text-brand-muted bg-white border border-brand-border px-3.5 py-2 rounded-xl shadow-xs">
        <div className="flex items-center gap-1.5 font-medium">
          <Calendar className="w-4 h-4 text-primary" />
          <span>{formatDualDate(currentDate)}</span>
        </div>
        <span className="font-semibold text-primary">नेपालभर (Nepal)</span>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-primary-light via-white to-[#FFF6ED] rounded-3xl border border-brand-border p-5 sm:p-8 shadow-xs">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>{t('tagline')}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-brand-text leading-tight">
            {t('home.hero_title')}
          </h1>

          <p className="text-sm sm:text-base text-brand-muted mt-2 sm:mt-3 leading-relaxed">
            {t('home.hero_subtitle')}
          </p>

          {/* Search Box */}
          <div className="mt-5 sm:mt-6">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-brand-muted absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('home.search_placeholder')}
                className="w-full pl-11 pr-24 py-3.5 rounded-2xl border-2 border-primary/20 bg-white focus:outline-none focus:border-primary text-sm shadow-sm min-h-[50px]"
              />
              <button
                type="button"
                className="absolute right-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all"
              >
                {t('common.search')}
              </button>
            </div>
          </div>

          {/* Quick CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Link
              href="/jobs/new"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold text-sm px-5 py-3.5 rounded-xl shadow-sm active:scale-98 transition-all min-h-[48px]"
            >
              <PlusCircle className="w-5 h-5 text-white" />
              <span>{t('home.post_job_btn')}</span>
            </Link>

            <Link
              href="#trades"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-brand-border text-brand-text font-bold text-sm px-5 py-3.5 rounded-xl shadow-xs active:scale-98 transition-all min-h-[48px]"
            >
              <Briefcase className="w-5 h-5 text-primary" />
              <span>{t('home.browse_trades')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Trust & Safety Warning Banner */}
      <div className="p-3.5 rounded-2xl bg-[#FFF8F0] border border-accent/20 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-accent flex-shrink-0" />
        <p className="text-xs font-semibold text-brand-text leading-snug">
          {t('common.safety_warning')}
        </p>
      </div>

      {/* Trades Grid */}
      <div id="trades" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-brand-text flex items-center gap-2">
            <span>{t('home.browse_trades')}</span>
            <span className="text-xs font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full">
              {TRADES_LIST.length}
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3">
          {TRADES_LIST.map((slug) => {
            const icon = TRADE_ICONS[slug] || <Wrench className="w-5 h-5 text-primary" />;
            const label = t(`trades.${slug}`);

            return (
              <Link
                key={slug}
                href={`/jobs?trade=${slug}`}
                className="bg-white rounded-2xl border border-brand-border p-3.5 sm:p-4 hover:border-primary/40 hover:shadow-sm active:scale-95 transition-all flex flex-col items-center text-center gap-2 touch-manipulation group min-h-[88px]"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center group-hover:scale-110 transition-transform">
                  {icon}
                </div>
                <span className="text-xs font-bold text-brand-text line-clamp-2 leading-tight">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Employer Banner */}
      <div className="bg-primary text-white rounded-3xl p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold">
            {t('home.post_job_cta_title')}
          </h3>
          <p className="text-xs sm:text-sm text-white/80">
            {t('home.post_job_cta_desc')}
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-md active:scale-95 transition-all whitespace-nowrap min-h-[48px]"
        >
          <span>{t('home.post_job_btn')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
