'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldAlert,
  LogIn,
  MapPin,
  Banknote,
  Users,
  FileText,
} from 'lucide-react';
import type { PayType } from '@/types/database.types';
import QuestionBuilder, { ScreeningQuestionInput } from '@/components/jobs/QuestionBuilder';

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

export default function PostJobPage() {
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);

  const [title, setTitle] = useState('');
  const [tradeSlug, setTradeSlug] = useState('');
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | ''>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | ''>('');
  const [tole, setTole] = useState('');
  const [payType, setPayType] = useState<PayType>('day');
  const [payMin, setPayMin] = useState('');
  const [payMax, setPayMax] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [positions, setPositions] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<ScreeningQuestionInput[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pre-fill user's district if already in profile
  useEffect(() => {
    if (profile?.district_id && !selectedDistrictId) {
      setSelectedDistrictId(profile.district_id);
    }
  }, [profile, selectedDistrictId]);

  // Load provinces, districts, and trades
  useEffect(() => {
    async function loadData() {
      const [provRes, distRes, tradeRes] = await Promise.all([
        supabase.from('provinces').select('*').order('id'),
        supabase.from('districts').select('*').order('name_en'),
        supabase.from('trades').select('*').order('sort'),
      ]);

      if (provRes.data) setProvinces(provRes.data);
      if (distRes.data) setDistricts(distRes.data);
      if (tradeRes.data) setTrades(tradeRes.data);
    }
    loadData();
  }, [supabase]);

  // Sync selected province when district changes
  useEffect(() => {
    if (selectedDistrictId && districts.length > 0) {
      const d = districts.find((dist) => dist.id === Number(selectedDistrictId));
      if (d && !selectedProvinceId) {
        setSelectedProvinceId(d.province_id);
      }
    }
  }, [selectedDistrictId, districts, selectedProvinceId]);

  const filteredDistricts = selectedProvinceId
    ? districts.filter((d) => d.province_id === Number(selectedProvinceId))
    : districts;

  // Helper to translate and surface database trigger errors nicely
  const parseDatabaseError = (rawMessage: string): string => {
    if (!rawMessage) return t('post_job.error_prefix') + 'Unknown error';

    // Foreign-employment blocked error
    if (
      rawMessage.includes('Foreign-employment') ||
      rawMessage.includes('Foreign-employment posts are not allowed') ||
      rawMessage.includes('inside Nepal')
    ) {
      return t('errors.foreign_job_blocked');
    }

    // Money-asking blocked error
    if (
      rawMessage.includes('pay money') ||
      rawMessage.includes('Jobs that ask workers to pay money')
    ) {
      return t('errors.asks_money_blocked');
    }

    // Rate limit error (max 5 jobs per day)
    if (rawMessage.includes('Too many requests') || rawMessage.includes('rate_limit')) {
      return t('errors.rate_limit_jobs');
    }

    return t('post_job.error_prefix') + rawMessage;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!user) {
      router.push('/login?next=/jobs/new');
      return;
    }

    if (!title.trim() || title.trim().length < 3) {
      setErrorMsg(
        language === 'ne'
          ? 'कृपया कम्तीमा ३ अक्षरको कामको शीर्षक लेख्नुहोस्।'
          : 'Job title must be at least 3 characters long.'
      );
      return;
    }

    if (!tradeSlug) {
      setErrorMsg(language === 'ne' ? 'कृपया कामको विधा छान्नुहोस्।' : 'Please select a trade.');
      return;
    }

    if (!selectedDistrictId) {
      setErrorMsg(language === 'ne' ? 'कृपया जिल्ला छान्नुहोस्।' : 'Please select a district.');
      return;
    }

    const minNum = payMin ? Number(payMin) : null;
    const maxNum = payMax ? Number(payMax) : null;

    if (minNum !== null && maxNum !== null && maxNum < minNum) {
      setErrorMsg(
        language === 'ne'
          ? 'अधिकतम रकम न्यूनतम रकम भन्दा बढी हुनुपर्छ।'
          : 'Max pay must be greater than or equal to min pay.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          employer_id: user.id,
          title: title.trim(),
          trade_slug: tradeSlug,
          district_id: Number(selectedDistrictId),
          tole: tole.trim() || null,
          pay_type: payType,
          pay_min: minNum,
          pay_max: maxNum,
          negotiable: negotiable,
          positions: positions || 1,
          description: description.trim(),
          status: 'open',
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      if (data?.id && questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          if (!q.question.trim()) continue;

          const filteredOptions =
            q.kind === 'mcq'
              ? q.options.filter((opt) => opt.trim() !== '')
              : null;

          const { data: qData, error: qErr } = await supabase
            .from('job_questions')
            .insert({
              job_id: data.id,
              position: i + 1,
              kind: q.kind,
              question: q.question.trim(),
              options: filteredOptions as any,
            })
            .select('id')
            .single();

          if (qErr) {
            console.error('Error inserting question:', qErr);
            continue;
          }

          if (q.kind === 'mcq' && qData?.id) {
            const safeCorrectIndex = Math.min(
              q.correctIndex,
              (filteredOptions?.length || 1) - 1
            );
            await supabase.from('job_question_keys').insert({
              question_id: qData.id,
              correct_index: Math.max(0, safeCorrectIndex),
            });
          }
        }
      }

      setSuccessMsg(t('post_job.success'));

      setTimeout(() => {
        if (data?.id) {
          router.push(`/jobs/${data.id}`);
        } else {
          router.push('/my-jobs');
        }
      }, 1000);
    } catch (err: any) {
      console.error('Post job error:', err);
      const friendlyMessage = parseDatabaseError(err.message || '');
      setErrorMsg(friendlyMessage);
    } finally {
      setSubmitting(false);
    }
  };

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
    <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-5">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('common.back')}</span>
      </Link>

      <div className="bg-white rounded-3xl border border-brand-border shadow-sm p-5 sm:p-8">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-brand-border">
          <h1 className="text-xl sm:text-2xl font-bold text-brand-text">
            {t('post_job.title')}
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            {t('post_job.subtitle')}
          </p>
        </div>

        {/* Mandatory Rules Card */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-amber-950">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{t('post_job.rules_title')}</span>
          </div>
          <p className="text-xs leading-relaxed">{t('post_job.rule_1')}</p>
          <p className="text-xs leading-relaxed font-semibold">{t('post_job.rule_2')}</p>
        </div>

        {/* Alert Messages */}
        {errorMsg && (
          <div className="mb-5 p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-red-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">
                {language === 'ne' ? 'नियम उल्लंघन वा समस्या:' : 'Posting rule issue:'}
              </span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Job Title & Trade */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-brand-text uppercase mb-1.5">
                {t('post_job.job_title')} *
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('post_job.job_title_placeholder')}
                className="w-full px-3.5 py-3 rounded-xl border border-brand-border focus:ring-2 focus:ring-primary focus:outline-none text-sm min-h-[46px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-text uppercase mb-1.5">
                  {t('post_job.trade')} *
                </label>
                <select
                  required
                  value={tradeSlug}
                  onChange={(e) => setTradeSlug(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-brand-border bg-white focus:ring-2 focus:ring-primary focus:outline-none text-sm min-h-[46px]"
                >
                  <option value="">-- {t('post_job.select_trade')} --</option>
                  {trades.map((tr) => (
                    <option key={tr.slug} value={tr.slug}>
                      {language === 'ne' ? tr.name_ne : tr.name_en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text uppercase mb-1.5">
                  <Users className="w-3.5 h-3.5 inline mr-1 text-primary" />
                  {t('post_job.positions')} *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={positions}
                  onChange={(e) => setPositions(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-3 rounded-xl border border-brand-border focus:ring-2 focus:ring-primary focus:outline-none text-sm min-h-[46px]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Location */}
          <div className="pt-4 border-t border-brand-border">
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" />
              {t('jobs.location')} (Nepal)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-text uppercase mb-1.5">
                  {t('post_job.province')}
                </label>
                <select
                  value={selectedProvinceId}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : '';
                    setSelectedProvinceId(val);
                    setSelectedDistrictId('');
                  }}
                  className="w-full px-3.5 py-3 rounded-xl border border-brand-border bg-white focus:ring-2 focus:ring-primary focus:outline-none text-sm min-h-[46px]"
                >
                  <option value="">-- {t('post_job.province')} --</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {language === 'ne' ? p.name_ne : p.name_en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text uppercase mb-1.5">
                  {t('post_job.district')} *
                </label>
                <select
                  required
                  value={selectedDistrictId}
                  onChange={(e) => setSelectedDistrictId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-3 rounded-xl border border-brand-border bg-white focus:ring-2 focus:ring-primary focus:outline-none text-sm min-h-[46px]"
                >
                  <option value="">-- {t('post_job.select_district')} --</option>
                  {filteredDistricts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {language === 'ne' ? d.name_ne : d.name_en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-brand-text uppercase mb-1.5">
                  {t('post_job.tole')}
                </label>
                <input
                  type="text"
                  value={tole}
                  onChange={(e) => setTole(e.target.value)}
                  placeholder={t('post_job.tole_placeholder')}
                  className="w-full px-3.5 py-3 rounded-xl border border-brand-border focus:ring-2 focus:ring-primary focus:outline-none text-sm min-h-[46px]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Pay / Compensation */}
          <div className="pt-4 border-t border-brand-border">
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-primary" />
              {t('jobs.pay')} (NPR)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-text uppercase mb-1.5">
                  {t('post_job.pay_type')} *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['day', 'hour', 'month', 'job'] as PayType[]).map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setPayType(pt)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                        payType === pt
                          ? 'bg-primary-light border-primary text-primary font-bold shadow-xs'
                          : 'bg-white border-brand-border text-brand-text hover:bg-gray-50'
                      }`}
                    >
                      {t(`common.per_${pt}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-text uppercase mb-1.5">
                    {t('post_job.pay_min')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={payMin}
                    onChange={(e) => setPayMin(e.target.value)}
                    placeholder="e.g. 1200"
                    className="w-full px-3.5 py-3 rounded-xl border border-brand-border focus:ring-2 focus:ring-primary focus:outline-none text-sm min-h-[46px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text uppercase mb-1.5">
                    {t('post_job.pay_max')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={payMax}
                    onChange={(e) => setPayMax(e.target.value)}
                    placeholder="e.g. 1800"
                    className="w-full px-3.5 py-3 rounded-xl border border-brand-border focus:ring-2 focus:ring-primary focus:outline-none text-sm min-h-[46px]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="negotiable"
                  checked={negotiable}
                  onChange={(e) => setNegotiable(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-brand-border cursor-pointer"
                />
                <label htmlFor="negotiable" className="text-xs sm:text-sm font-semibold text-brand-text cursor-pointer">
                  {t('post_job.negotiable')}
                </label>
              </div>
            </div>
          </div>

          {/* Section 4: Detailed Description */}
          <div className="pt-4 border-t border-brand-border">
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-primary" />
              {t('post_job.description')}
            </h2>

            <div>
              <textarea
                rows={5}
                maxLength={3000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('post_job.description_placeholder')}
                className="w-full px-3.5 py-3 rounded-xl border border-brand-border focus:ring-2 focus:ring-primary focus:outline-none text-sm resize-none"
              ></textarea>
              <div className="text-right text-[11px] text-brand-muted mt-1">
                {description.length} / 3000
              </div>
            </div>
          </div>

          {/* Section 5: Optional Screening Builder */}
          <QuestionBuilder
            tradeSlug={tradeSlug}
            questions={questions}
            onChange={setQuestions}
          />

          {/* Submit Action */}
          <div className="pt-4 border-t border-brand-border">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold text-base shadow-md active:scale-[0.99] transition-all min-h-[52px] flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span>{t('post_job.submitting')}</span>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  <span>{t('post_job.submit_btn')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
