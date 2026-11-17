'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatPay } from '@/lib/utils/pay';
import {
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Briefcase,
  LogIn,
  Check,
} from 'lucide-react';
import type { Database } from '@/types/database.types';

type JobQuestion = Database['public']['Tables']['job_questions']['Row'];

export default function JobApplyPage() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [job, setJob] = useState<any>(null);
  const [questions, setQuestions] = useState<JobQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);

  // Form state
  const [coverMessage, setCoverMessage] = useState('');
  const [answers, setAnswers] = useState<Record<string, { index?: number; text?: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadJobAndQuestions() {
      if (!id) return;
      setLoading(true);

      try {
        // Fetch job
        const { data: jobData, error: jobErr } = await supabase
          .from('jobs')
          .select(`
            id,
            title,
            employer_id,
            trade_slug,
            pay_type,
            pay_min,
            pay_max,
            negotiable,
            status,
            districts (
              name_ne,
              name_en
            )
          `)
          .eq('id', id)
          .maybeSingle();

        if (jobErr) console.error(jobErr);
        if (jobData) {
          setJob(jobData);

          // Check if user already applied
          if (user) {
            const { data: existingApp } = await supabase
              .from('applications')
              .select('id')
              .eq('job_id', id)
              .eq('applicant_id', user.id)
              .maybeSingle();

            if (existingApp) {
              setHasApplied(true);
            }
          }

          // Fetch screening questions
          const { data: qData } = await supabase
            .from('job_questions')
            .select('*')
            .eq('job_id', id)
            .order('position', { ascending: true });

          if (qData) {
            setQuestions(qData);
          }
        }
      } catch (err) {
        console.error('Error loading apply page:', err);
      } finally {
        setLoading(false);
      }
    }

    loadJobAndQuestions();
  }, [id, user, supabase]);

  const handleMcqSelect = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { index: optionIndex },
    }));
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { text },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user) {
      router.push(`/login?next=/jobs/${id}/apply`);
      return;
    }

    if (user.id === job?.employer_id) {
      setErrorMsg(
        language === 'ne'
          ? 'तपाईं आफ्नै काममा आवेदन दिन सक्नुहुन्न।'
          : 'You cannot apply to your own job.'
      );
      return;
    }

    // Validate that all MCQ questions are answered
    for (const q of questions) {
      if (q.kind === 'mcq') {
        if (answers[q.id]?.index === undefined) {
          setErrorMsg(
            language === 'ne'
              ? 'कृपया सबै बहुवैकल्पिक (MCQ) प्रश्नहरूको उत्तर दिनुहोस्।'
              : 'Please answer all multiple choice screening questions.'
          );
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      // 1. Insert application
      const { data: appData, error: appErr } = await supabase
        .from('applications')
        .insert({
          job_id: id,
          applicant_id: user.id,
          message: coverMessage.trim() || null,
          status: 'applied',
        })
        .select('id')
        .single();

      if (appErr) {
        if (appErr.message?.includes('rate_limit') || appErr.message?.includes('Too many requests')) {
          throw new Error(t('errors.rate_limit_apps'));
        }
        throw appErr;
      }

      // 2. Insert application answers
      if (appData?.id && questions.length > 0) {
        const answersToInsert = questions.map((q) => {
          const ans = answers[q.id];
          return {
            application_id: appData.id,
            question_id: q.id,
            answer_index: q.kind === 'mcq' ? ans?.index ?? null : null,
            answer_text: q.kind === 'text' ? ans?.text?.trim() ?? null : null,
          };
        });

        const { error: ansErr } = await supabase
          .from('application_answers')
          .insert(answersToInsert);

        if (ansErr) {
          console.error('Error inserting application answers:', ansErr);
        }
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('Application submit error:', err);
      setErrorMsg(err.message || t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center text-brand-muted">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs">{t('common.loading')}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="bg-white rounded-2xl border border-brand-border p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-primary-light text-primary mx-auto flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-brand-text mb-2">
            {t('jobs.login_to_apply')}
          </h1>
          <p className="text-sm text-brand-muted mb-6">
            {t('auth.login_required_desc')}
          </p>
          <Link
            href={`/login?next=/jobs/${id}/apply`}
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-accent text-white font-bold text-sm shadow-sm hover:bg-accent-hover active:scale-95 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>{t('nav.login')}</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="bg-white rounded-2xl border border-brand-border p-8 shadow-sm space-y-3">
          <h1 className="text-lg font-bold text-brand-text">
            {language === 'ne' ? 'काम फेला परेन' : 'Job Not Found'}
          </h1>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('jobs.all_jobs')}</span>
          </Link>
        </div>
      </div>
    );
  }

  if (hasApplied || submitted) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="bg-white rounded-3xl border border-brand-border p-8 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-brand-text">
            {t('apply.success_title')}
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
            {t('apply.success_desc')}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/my-jobs"
              className="w-full py-3 px-4 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:bg-primary-hover active:scale-95 transition-all"
            >
              {language === 'ne' ? 'मेरा आवेदनहरू हेर्नुहोस्' : 'View My Applications'}
            </Link>
            <Link
              href={`/jobs/${id}`}
              className="w-full py-3 px-4 rounded-xl border border-brand-border text-brand-text font-bold text-xs hover:bg-gray-50 active:scale-95 transition-all"
            >
              {language === 'ne' ? 'कामको विवरणमा फर्कनुहोस्' : 'Back to Job Details'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const districtName = job.districts
    ? language === 'ne'
      ? job.districts.name_ne
      : job.districts.name_en
    : '';

  const payText = formatPay(job.pay_type, job.pay_min, job.pay_max, job.negotiable, language);

  return (
    <div className="max-w-xl mx-auto py-4 sm:py-6 space-y-5">
      {/* Back button */}
      <div>
        <Link
          href={`/jobs/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-xs space-y-2">
        <span className="text-xs font-bold text-primary bg-primary-light px-2.5 py-0.5 rounded-full inline-block">
          {t(`trades.${job.trade_slug}`, job.trade_slug)}
        </span>
        <h1 className="text-lg sm:text-xl font-bold text-brand-text">
          {job.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-brand-muted pt-1">
          {districtName && <span>📍 {districtName}</span>}
          <span>💰 {payText}</span>
        </div>
      </div>

      {/* Application Form */}
      <div className="bg-white rounded-2xl border border-brand-border p-5 sm:p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Cover Message */}
          <div>
            <label className="block text-xs font-bold uppercase text-brand-text mb-1.5">
              {t('apply.cover_message')}
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={coverMessage}
              onChange={(e) => setCoverMessage(e.target.value)}
              placeholder={t('apply.cover_placeholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            ></textarea>
            <div className="text-right text-[11px] text-brand-muted mt-1">
              {coverMessage.length} / 500
            </div>
          </div>

          {/* Screening Questions */}
          {questions.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-brand-border">
              <div>
                <h2 className="text-sm font-bold text-brand-text flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  <span>{t('apply.screening_title')}</span>
                </h2>
                <p className="text-xs text-brand-muted mt-0.5">
                  {t('apply.screening_desc')}
                </p>
              </div>

              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const opts = Array.isArray(q.options)
                    ? (q.options as string[])
                    : [];

                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl border border-brand-border bg-brand-bg/50 space-y-3"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-black text-primary flex-shrink-0 mt-0.5">
                          Q{idx + 1}.
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-brand-text">
                          {q.question}
                        </p>
                      </div>

                      {q.kind === 'mcq' ? (
                        <div className="space-y-2 pt-1 pl-4">
                          {opts.map((opt, optIdx) => {
                            const isSelected = answers[q.id]?.index === optIdx;
                            return (
                              <label
                                key={optIdx}
                                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-primary-light/50 border-primary text-primary font-semibold'
                                    : 'bg-white border-brand-border text-brand-text hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question_${q.id}`}
                                  checked={isSelected}
                                  onChange={() => handleMcqSelect(q.id, optIdx)}
                                  className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="pt-1 pl-4">
                          <textarea
                            rows={3}
                            maxLength={1000}
                            value={answers[q.id]?.text || ''}
                            onChange={(e) => handleTextChange(q.id, e.target.value)}
                            placeholder={t('common.details_placeholder') || 'Your answer...'}
                            className="w-full px-3 py-2 rounded-xl border border-brand-border bg-white text-xs text-brand-text focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                          ></textarea>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              {submitting ? (
                <span>{t('apply.submitting')}</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{t('apply.submit_btn')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
