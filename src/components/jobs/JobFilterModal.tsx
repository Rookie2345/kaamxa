'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { X, Filter, RotateCcw } from 'lucide-react';
import type { PayType } from '@/types/database.types';

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

interface Filters {
  trade: string;
  provinceId: number | '';
  districtId: number | '';
  payType: PayType | '';
  minPay: string;
}

interface JobFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onApply: () => void;
  onClear: () => void;
  provinces: Province[];
  districts: District[];
  trades: Trade[];
}

export function JobFilterModal({
  isOpen,
  onClose,
  filters,
  setFilters,
  onApply,
  onClear,
  provinces,
  districts,
  trades,
}: JobFilterModalProps) {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  const filteredDistricts = filters.provinceId
    ? districts.filter((d) => d.province_id === Number(filters.provinceId))
    : districts;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-brand-border">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-brand-text">
              {t('jobs.filters_title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-brand-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Trade Filter */}
          <div>
            <label className="block text-xs font-bold text-brand-text uppercase mb-1.5">
              {t('post_job.trade')}
            </label>
            <select
              value={filters.trade}
              onChange={(e) => setFilters((prev) => ({ ...prev, trade: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border bg-white text-sm focus:ring-2 focus:ring-primary focus:outline-none min-h-[44px]"
            >
              <option value="">-- {t('common.all')} ({t('home.all_trades')}) --</option>
              {trades.map((tr) => (
                <option key={tr.slug} value={tr.slug}>
                  {language === 'ne' ? tr.name_ne : tr.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Location: Province > District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-brand-text uppercase mb-1.5">
                {t('post_job.province')}
              </label>
              <select
                value={filters.provinceId}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : '';
                  setFilters((prev) => ({
                    ...prev,
                    provinceId: val,
                    districtId: '',
                  }));
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border bg-white text-sm focus:ring-2 focus:ring-primary focus:outline-none min-h-[44px]"
              >
                <option value="">-- {t('common.all')} --</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {language === 'ne' ? p.name_ne : p.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text uppercase mb-1.5">
                {t('post_job.district')}
              </label>
              <select
                value={filters.districtId}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : '';
                  setFilters((prev) => ({ ...prev, districtId: val }));
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border bg-white text-sm focus:ring-2 focus:ring-primary focus:outline-none min-h-[44px]"
              >
                <option value="">-- {t('common.all')} --</option>
                {filteredDistricts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {language === 'ne' ? d.name_ne : d.name_en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pay Type */}
          <div>
            <label className="block text-xs font-bold text-brand-text uppercase mb-1.5">
              {t('post_job.pay_type')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: '', label: t('common.all') },
                { type: 'day', label: t('common.per_day') },
                { type: 'hour', label: t('common.per_hour') },
                { type: 'month', label: t('common.per_month') },
                { type: 'job', label: t('common.per_job') },
              ].map((pt) => {
                const isSelected = filters.payType === pt.type;
                return (
                  <button
                    key={pt.type}
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, payType: pt.type as any }))}
                    className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition-all ${
                      isSelected
                        ? 'bg-primary-light border-primary text-primary font-bold'
                        : 'bg-white border-brand-border text-brand-text hover:bg-gray-50'
                    }`}
                  >
                    {pt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Min Pay */}
          <div>
            <label className="block text-xs font-bold text-brand-text uppercase mb-1.5">
              {t('post_job.pay_min')}
            </label>
            <input
              type="number"
              min="0"
              value={filters.minPay}
              onChange={(e) => setFilters((prev) => ({ ...prev, minPay: e.target.value }))}
              placeholder="e.g. 1000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border bg-white text-sm focus:ring-2 focus:ring-primary focus:outline-none min-h-[44px]"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-brand-border flex items-center justify-between gap-3 bg-gray-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-brand-muted hover:text-brand-text rounded-xl"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('jobs.clear_filters')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onApply();
              onClose();
            }}
            className="flex-1 max-w-[200px] py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-sm active:scale-95 transition-all text-center"
          >
            {t('jobs.apply_filters')}
          </button>
        </div>
      </div>
    </div>
  );
}
