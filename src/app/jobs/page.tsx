'use client';

import React, { useState, useEffect, Suspense, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilterModal } from '@/components/jobs/JobFilterModal';
import { Search, Filter, PlusCircle, X, AlertCircle } from 'lucide-react';
import type { Database, PayType } from '@/types/database.types';

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

interface Province {
  id: number;
  name_en: string;
  name_ne: string;
}

interface District {
  id: number;
  province_id: number;
  name_en: string;
  name_ne: string;
}

interface Trade {
  slug: string;
  name_en: string;
  name_ne: string;
}

function JobsListContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const initialTrade = searchParams.get('trade') || '';
  const initialDistrict = searchParams.get('district') ? Number(searchParams.get('district')) : '';

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    trade: string;
    provinceId: number | '';
    districtId: number | '';
    payType: PayType | '';
    minPay: string;
  }>({
    trade: initialTrade,
    provinceId: '',
    districtId: initialDistrict,
    payType: '',
    minPay: '',
  });

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);

  // Load reference tables
  useEffect(() => {
    async function loadReferenceData() {
      const [provRes, distRes, tradeRes] = await Promise.all([
        supabase.from('provinces').select('*').order('id'),
        supabase.from('districts').select('*').order('name_en'),
        supabase.from('trades').select('*').order('sort'),
      ]);

      if (provRes.data) setProvinces(provRes.data);
      if (distRes.data) setDistricts(distRes.data);
      if (tradeRes.data) setTrades(tradeRes.data);
    }
    loadReferenceData();
  }, [supabase]);

  // Fetch jobs with active filters
  const fetchJobs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          districts (
            name_ne,
            name_en
          ),
          profiles:employer_id (
            full_name,
            rating_avg,
            rating_count
          )
        `)
        .eq('status', 'open')
        .eq('is_hidden', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (filters.trade) {
        query = query.eq('trade_slug', filters.trade);
      }
      if (filters.districtId) {
        query = query.eq('district_id', Number(filters.districtId));
      }
      if (filters.payType) {
        query = query.eq('pay_type', filters.payType);
      }
      if (filters.minPay) {
        query = query.or(`pay_max.gte.${filters.minPay},pay_min.gte.${filters.minPay}`);
      }
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery.trim()}%,description.ilike.%${searchQuery.trim()}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching jobs:', error);
      } else {
        setJobs(data as any || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filters.trade, filters.districtId, filters.payType, filters.minPay]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleClearFilters = () => {
    setFilters({
      trade: '',
      provinceId: '',
      districtId: '',
      payType: '',
      minPay: '',
    });
    setSearchQuery('');
  };

  const activeFilterCount =
    (filters.trade ? 1 : 0) +
    (filters.districtId ? 1 : 0) +
    (filters.payType ? 1 : 0) +
    (filters.minPay ? 1 : 0);

  const selectedDistrict = districts.find((d) => d.id === Number(filters.districtId));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-brand-border p-3 sm:p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('jobs.search_jobs')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border bg-brand-bg/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm min-h-[44px]"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 bg-primary text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-primary-hover active:scale-95 transition-all min-h-[44px]"
          >
            {t('common.search')}
          </button>

          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl border font-bold text-xs sm:text-sm transition-all min-h-[44px] ${
              activeFilterCount > 0
                ? 'bg-primary-light border-primary text-primary'
                : 'bg-white border-brand-border text-brand-text hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden xs:inline">{t('jobs.filter_btn')}</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </form>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-brand-border/60">
            <span className="text-[11px] font-bold text-brand-muted uppercase">
              {t('jobs.filters_title')}:
            </span>

            {filters.trade && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary-light text-primary border border-primary/20">
                <span>{t(`trades.${filters.trade}`, filters.trade)}</span>
                <button
                  type="button"
                  onClick={() => setFilters((p) => ({ ...p, trade: '' }))}
                  className="hover:text-red-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {selectedDistrict && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary-light text-primary border border-primary/20">
                <span>{language === 'ne' ? selectedDistrict.name_ne : selectedDistrict.name_en}</span>
                <button
                  type="button"
                  onClick={() => setFilters((p) => ({ ...p, districtId: '' }))}
                  className="hover:text-red-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.payType && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary-light text-primary border border-primary/20">
                <span>{t(`common.per_${filters.payType}`)}</span>
                <button
                  type="button"
                  onClick={() => setFilters((p) => ({ ...p, payType: '' }))}
                  className="hover:text-red-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleClearFilters}
              className="text-[11px] text-accent font-bold hover:underline ml-auto"
            >
              {t('jobs.clear_filters')}
            </button>
          </div>
        )}
      </div>

      {/* Jobs Feed Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg sm:text-xl font-bold text-brand-text">
          {t('jobs.title')}
          <span className="text-xs font-semibold text-brand-muted ml-2">
            ({jobs.length})
          </span>
        </h1>

        <Link
          href="/jobs/new"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover active:scale-95 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('nav.post_job')}</span>
        </Link>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-brand-border p-4 animate-pulse space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="w-24 h-5 bg-gray-200 rounded-lg"></div>
                <div className="w-20 h-5 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="w-3/4 h-6 bg-gray-200 rounded-lg"></div>
              <div className="flex gap-4">
                <div className="w-24 h-4 bg-gray-100 rounded"></div>
                <div className="w-20 h-4 bg-gray-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-brand-border p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-bg text-brand-muted mx-auto flex items-center justify-center">
            <Search className="w-8 h-8 text-brand-muted" />
          </div>
          <h2 className="text-lg font-bold text-brand-text">
            {t('jobs.no_jobs_found')}
          </h2>
          <p className="text-xs sm:text-sm text-brand-muted max-w-sm mx-auto">
            {t('jobs.no_jobs_desc')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-brand-border text-brand-text font-bold text-xs hover:bg-gray-50 min-h-[44px]"
              >
                {t('jobs.clear_filters')}
              </button>
            )}
            <Link
              href="/jobs/new"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-sm active:scale-95 transition-all min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('jobs.post_first_job')}</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Jobs List */
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Filter Modal */}
      <JobFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={fetchJobs}
        onClear={handleClearFilters}
        provinces={provinces}
        districts={districts}
        trades={trades}
      />
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto py-12 text-center text-brand-muted">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs">Loading jobs...</p>
        </div>
      }
    >
      <JobsListContent />
    </Suspense>
  );
}
