'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatPay } from '@/lib/utils/pay';
import { formatDualDate } from '@/lib/utils/date';
import ReviewModal from '@/components/reviews/ReviewModal';
import {
  Briefcase,
  Send,
  PlusCircle,
  LogIn,
  Users,
  CheckCircle2,
  Clock,
  MessageSquare,
  Star,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import type { Database } from '@/types/database.types';

export default function MyJobsPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<'employer' | 'worker'>('employer');
  const [employerJobs, setEmployerJobs] = useState<any[]>([]);
  const [workerApps, setWorkerApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [reviewModalData, setReviewModalData] = useState<{
    hireId: string;
    revieweeId: string;
    revieweeName: string;
  } | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch Employer Jobs
      const { data: jobsData, error: jobsErr } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          trade_slug,
          status,
          positions,
          filled,
          pay_type,
          pay_min,
          pay_max,
          negotiable,
          created_at,
          expires_at,
          districts (
            name_ne,
            name_en
          )
        `)
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false });

      if (jobsErr) console.error(jobsErr);

      if (jobsData && jobsData.length > 0) {
        // Fetch applicant counts & active hires for each job
        const jobIds = jobsData.map((j) => j.id);

        const [appsRes, hiresRes] = await Promise.all([
          supabase.from('applications').select('job_id'),
          supabase.from('hires').select('id, job_id, worker_id, status'),
        ]);

        const countMap: Record<string, number> = {};
        if (appsRes.data) {
          appsRes.data.forEach((a: any) => {
            countMap[a.job_id] = (countMap[a.job_id] || 0) + 1;
          });
        }

        const hiresMap: Record<string, any[]> = {};
        if (hiresRes.data) {
          hiresRes.data.forEach((h: any) => {
            if (!hiresMap[h.job_id]) hiresMap[h.job_id] = [];
            hiresMap[h.job_id].push(h);
          });
        }

        const enrichedJobs = jobsData.map((j) => ({
          ...j,
          applicantCount: countMap[j.id] || 0,
          hires: hiresMap[j.id] || [],
        }));

        setEmployerJobs(enrichedJobs);
      } else {
        setEmployerJobs([]);
      }

      // 2. Fetch Worker Applications
      const { data: appsData, error: appsErr } = await supabase
        .from('applications')
        .select(`
          id,
          job_id,
          status,
          score,
          max_score,
          created_at,
          jobs (
            id,
            title,
            trade_slug,
            employer_id,
            pay_type,
            pay_min,
            pay_max,
            negotiable,
            profiles:employer_id (
              id,
              full_name,
              rating_avg
            )
          )
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });

      if (appsErr) console.error(appsErr);

      if (appsData && appsData.length > 0) {
        // Fetch any hires linked to these applications
        const appIds = appsData.map((a) => a.id);
        const { data: workerHires } = await supabase
          .from('hires')
          .select('id, application_id, status, employer_id')
          .in('application_id', appIds);

        const hireMap: Record<string, any> = {};
        if (workerHires) {
          workerHires.forEach((h) => {
            hireMap[h.application_id] = h;
          });
        }

        const enrichedApps = appsData.map((a) => ({
          ...a,
          hire: hireMap[a.id] || null,
        }));

        setWorkerApps(enrichedApps);
      } else {
        setWorkerApps([]);
      }
    } catch (err) {
      console.error('Error loading my-jobs data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCompleteHire = async (hireId: string) => {
    if (!confirm(language === 'ne' ? 'के यो काम सम्पन्न भयो?' : 'Mark this job as completed?')) return;
    try {
      const { error } = await supabase.rpc('complete_hire', {
        hire_id: hireId,
      });
      if (error) throw error;
      await loadData();
    } catch (err: any) {
      console.error('Complete hire error:', err);
      alert(err.message || 'Error completing hire');
    }
  };

  const handleStartChat = async (otherId: string, jobId: string) => {
    try {
      const { data: convId, error } = await supabase.rpc('get_or_create_conversation', {
        other: otherId,
        for_job: jobId,
      });
      if (error) throw error;
      if (convId) {
        router.push(`/chat/${convId}`);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      alert(err.message || 'Error starting chat');
    }
  };

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
    <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-text">
          {t('my_jobs.title')}
        </h1>
        <Link
          href="/jobs/new"
          className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-primary-hover active:scale-95 transition-all shadow-xs"
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
          className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
            tab === 'employer'
              ? 'bg-white text-primary shadow-xs'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          {t('my_jobs.tab_employer')} ({employerJobs.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('worker')}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
            tab === 'worker'
              ? 'bg-white text-primary shadow-xs'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          {t('my_jobs.tab_worker')} ({workerApps.length})
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-brand-muted">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs">{t('common.loading')}</p>
        </div>
      ) : tab === 'employer' ? (
        /* EMPLOYER JOBS LIST */
        employerJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-border p-8 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-brand-bg text-brand-muted mx-auto flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-primary/60" />
            </div>
            <h2 className="text-base font-bold text-brand-text">
              {t('my_jobs.empty_employer')}
            </h2>
            <div className="pt-2">
              <Link
                href="/jobs/new"
                className="inline-flex items-center gap-2 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary-hover active:scale-95 transition-all shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('home.post_job_btn')}</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {employerJobs.map((job) => {
              const pay = formatPay(job.pay_type, job.pay_min, job.pay_max, job.negotiable, language);
              const activeHire = job.hires?.find((h: any) => h.status === 'active');
              const completedHire = job.hires?.find((h: any) => h.status === 'completed');

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-brand-border p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-primary bg-primary-light px-2 py-0.5 rounded-lg inline-block mb-1">
                        {t(`trades.${job.trade_slug}`, job.trade_slug)}
                      </span>
                      <h2 className="text-base font-bold text-brand-text">
                        {job.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-brand-muted mt-1">
                        <span>💰 {pay}</span>
                        <span>•</span>
                        <span>
                          {job.filled}/{job.positions} {t('applicants.hired')}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        job.status === 'open'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-brand-border">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-muted hover:text-brand-text"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{t('my_jobs.view_job')}</span>
                      </Link>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeHire && (
                        <button
                          type="button"
                          onClick={() => handleCompleteHire(activeHire.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-2xs hover:bg-blue-700 active:scale-95 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{t('my_jobs.complete_work')}</span>
                        </button>
                      )}

                      {completedHire && (
                        <button
                          type="button"
                          onClick={() =>
                            setReviewModalData({
                              hireId: completedHire.id,
                              revieweeId: completedHire.worker_id,
                              revieweeName: 'Worker',
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 font-bold text-xs hover:bg-amber-100 active:scale-95 transition-all"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{t('my_jobs.leave_review')}</span>
                        </button>
                      )}

                      <Link
                        href={`/jobs/${job.id}/applicants`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white font-bold text-xs shadow-xs hover:bg-primary-hover active:scale-95 transition-all"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          {t('my_jobs.view_applicants')} ({job.applicantCount})
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* WORKER APPLICATIONS LIST */
        workerApps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-border p-8 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-brand-bg text-brand-muted mx-auto flex items-center justify-center">
              <Send className="w-7 h-7 text-accent/60" />
            </div>
            <h2 className="text-base font-bold text-brand-text">
              {t('my_jobs.empty_worker')}
            </h2>
            <div className="pt-2">
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 bg-accent text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-accent-hover active:scale-95 transition-all shadow-xs"
              >
                <span>{t('nav.jobs')}</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {workerApps.map((app) => {
              const job = app.jobs;
              const isHired = app.status === 'hired';
              const isCompleted = app.hire?.status === 'completed';

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl border border-brand-border p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {job && (
                        <span className="text-xs font-bold text-primary bg-primary-light px-2 py-0.5 rounded-lg inline-block mb-1">
                          {t(`trades.${job.trade_slug}`, job.trade_slug)}
                        </span>
                      )}
                      <h2 className="text-base font-bold text-brand-text">
                        {job?.title || 'Job Listing'}
                      </h2>
                      <p className="text-xs text-brand-muted mt-0.5">
                        {job?.profiles?.full_name && `Employer: ${job.profiles.full_name}`} •{' '}
                        {formatDualDate(app.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase ${
                          isHired
                            ? 'bg-green-100 text-green-800'
                            : app.status === 'shortlisted'
                            ? 'bg-blue-100 text-blue-800'
                            : app.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {t(`applicants.status_${app.status}`)}
                      </span>

                      {app.max_score > 0 && (
                        <span className="text-[10px] font-extrabold text-primary">
                          Score: {app.score}/{app.max_score}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-brand-border">
                    <Link
                      href={`/jobs/${app.job_id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-muted hover:text-brand-text"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t('my_jobs.view_job')}</span>
                    </Link>

                    <div className="flex items-center gap-2">
                      {isCompleted && app.hire && (
                        <button
                          type="button"
                          onClick={() =>
                            setReviewModalData({
                              hireId: app.hire.id,
                              revieweeId: app.hire.employer_id,
                              revieweeName: job?.profiles?.full_name || 'Employer',
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 font-bold text-xs hover:bg-amber-100 active:scale-95 transition-all"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{t('my_jobs.leave_review')}</span>
                        </button>
                      )}

                      {job?.employer_id && (
                        <button
                          type="button"
                          onClick={() => handleStartChat(job.employer_id, job.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white font-bold text-xs shadow-xs hover:bg-primary-hover active:scale-95 transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{t('chat.title')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Review Modal */}
      {reviewModalData && (
        <ReviewModal
          hireId={reviewModalData.hireId}
          revieweeId={reviewModalData.revieweeId}
          revieweeName={reviewModalData.revieweeName}
          isOpen={true}
          onClose={() => setReviewModalData(null)}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}
