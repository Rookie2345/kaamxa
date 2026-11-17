'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { formatPay } from '@/lib/utils/pay';
import { formatRelativeTime } from '@/lib/utils/date';
import type { Database } from '@/types/database.types';
import { MapPin, Users, Star, Clock } from 'lucide-react';

type Job = Database['public']['Tables']['jobs']['Row'] & {
  districts?: {
    name_ne: string;
    name_en: string;
  } | null;
  profiles?: {
    full_name: string;
    rating_avg: number;
    rating_count: number;
  } | null;
};

export function JobCard({ job }: { job: Job }) {
  const { t, language } = useLanguage();

  const districtName = job.districts
    ? language === 'ne'
      ? job.districts.name_ne
      : job.districts.name_en
    : `District #${job.district_id}`;

  const tradeName = t(`trades.${job.trade_slug}`, job.trade_slug);
  const payFormatted = formatPay(job.pay_type, job.pay_min, job.pay_max, job.negotiable, language);
  const timePosted = formatRelativeTime(job.created_at, language);

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block bg-white rounded-2xl border border-brand-border p-4 hover:border-primary/50 hover:shadow-sm active:scale-[0.99] transition-all touch-manipulation group"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Trade badge */}
        <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg bg-primary-light text-primary">
          {tradeName}
        </span>

        {/* Pay Display */}
        <span className="text-xs sm:text-sm font-bold text-primary text-right whitespace-nowrap">
          {payFormatted}
        </span>
      </div>

      {/* Job Title */}
      <h3 className="text-base font-bold text-brand-text group-hover:text-primary transition-colors mt-2.5 line-clamp-2 leading-snug">
        {job.title}
      </h3>

      {/* Location & Details */}
      <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-brand-muted mt-2.5">
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="truncate max-w-[160px]">
            {job.tole ? `${job.tole}, ` : ''}{districtName}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-brand-muted flex-shrink-0" />
          <span>
            {job.positions} {t('jobs.positions_available')}
          </span>
        </div>

        {job.profiles && job.profiles.rating_count > 0 && (
          <div className="flex items-center gap-1 text-amber-600 font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>{job.profiles.rating_avg}</span>
          </div>
        )}
      </div>

      {/* Footer: Posted time & quick tag */}
      <div className="flex items-center justify-between text-[11px] text-brand-muted mt-3 pt-3 border-t border-brand-border/70">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-brand-muted" />
          <span>{timePosted}</span>
        </div>

        <span className="text-accent font-semibold group-hover:underline">
          {language === 'ne' ? 'विवरण हेर्नुहोस् →' : 'View Details →'}
        </span>
      </div>
    </Link>
  );
}
