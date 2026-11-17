'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Briefcase, Send, PlusCircle, LogIn } from 'lucide-react';

export default function MyJobsPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [tab, setTab] = useState<'employer' | 'worker'>('employer');

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="bg-white rounded-2xl border border-brand-border p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-primary-light text-primary mx-auto flex items-center justify-center mb-4">
            <Briefcase className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-brand-text mb-2">
            {t('nav.my_jobs')}
          </h1>
          <p className="text-sm text-brand-muted mb-6">
            {t('auth.login_required_desc')}
          </p>
          <Link
            href="/login?next=/my-jobs"
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
    <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-text">
          {t('nav.my_jobs')}
        </h1>
        <Link
          href="/jobs/new"
          className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-primary-hover active:scale-95 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('nav.post_job')}</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setTab('employer')}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
            tab === 'employer'
              ? 'bg-white text-primary shadow-xs'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          {language === 'ne' ? 'मैले हालेका कामहरू (Employer)' : 'Posted Jobs (Employer)'}
        </button>
        <button
          type="button"
          onClick={() => setTab('worker')}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
            tab === 'worker'
              ? 'bg-white text-primary shadow-xs'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          {language === 'ne' ? 'मेरा आवेदनहरू (Worker)' : 'My Applications (Worker)'}
        </button>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-2xl border border-brand-border p-8 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-brand-bg text-brand-muted mx-auto flex items-center justify-center">
          {tab === 'employer' ? (
            <Briefcase className="w-7 h-7 text-primary/60" />
          ) : (
            <Send className="w-7 h-7 text-accent/60" />
          )}
        </div>
        <h2 className="text-base font-bold text-brand-text">
          {tab === 'employer'
            ? language === 'ne'
              ? 'तपाईंले अहिले सम्म कुनै काम हाल्नुभएको छैन'
              : 'You have not posted any jobs yet'
            : language === 'ne'
              ? 'तपाईंले कुनै काममा आवेदन दिनुभएको छैन'
              : 'You have not applied for any jobs yet'}
        </h2>
        <p className="text-xs sm:text-sm text-brand-muted max-w-sm mx-auto">
          {tab === 'employer'
            ? language === 'ne'
              ? 'कामदार चाहिएको छ भने नयाँ कामको सूचना प्रकाशित गर्नुहोस्।'
              : 'Post a job to find skilled or daily-wage workers across Nepal.'
            : language === 'ne'
              ? 'होमपेजमा गएर आफ्नो सीप अनुसारको काम खोज्नुहोस् र आवेदन दिनुहोस्।'
              : 'Browse open jobs on the home page and apply directly.'}
        </p>

        <div className="pt-2">
          {tab === 'employer' ? (
            <Link
              href="/jobs/new"
              className="inline-flex items-center gap-2 bg-primary text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-primary-hover active:scale-95 transition-all shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('home.post_job_btn')}</span>
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-accent text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-accent-hover active:scale-95 transition-all shadow-xs"
            >
              <span>{t('nav.home')}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
