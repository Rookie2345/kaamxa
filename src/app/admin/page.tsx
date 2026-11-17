'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatDualDate } from '@/lib/utils/date';
import {
  Shield,
  Briefcase,
  User,
  Flag,
  RotateCcw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

export default function AdminPage() {
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'jobs' | 'profiles' | 'reports'>('jobs');

  const [flaggedJobs, setFlaggedJobs] = useState<any[]>([]);
  const [flaggedProfiles, setFlaggedProfiles] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const checkAdminAndLoad = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Check admin status
      const { data: adminBool } = await supabase.rpc('is_admin');
      const hasAdminRights = Boolean(adminBool || profile?.is_admin);
      setIsAdmin(hasAdminRights);

      if (!hasAdminRights) {
        setLoading(false);
        return;
      }

      // Fetch flagged jobs
      const { data: jobs } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          trade_slug,
          status,
          is_hidden,
          report_count,
          created_at,
          employer_id,
          profiles:employer_id (
            full_name
          )
        `)
        .or('is_hidden.eq.true,report_count.gt.0')
        .order('report_count', { ascending: false });

      if (jobs) setFlaggedJobs(jobs);

      // Fetch flagged profiles
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, is_hidden, report_count, created_at')
        .or('is_hidden.eq.true,report_count.gt.0')
        .order('report_count', { ascending: false });

      if (profs) setFlaggedProfiles(profs);

      // Fetch reports
      const { data: reps } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (reps) setRecentReports(reps);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminAndLoad();
  }, [user, profile]);

  const handleRestore = async (kind: 'job' | 'profile', targetId: string) => {
    if (!confirm(language === 'ne' ? 'के तपाईं यसलाई पुनः सुचारु गर्न निश्चित हुनुहुन्छ?' : 'Are you sure you want to restore this item?')) return;

    setActionLoading(targetId);
    setFeedback(null);

    try {
      const { error } = await supabase.rpc('admin_restore', {
        kind,
        target: targetId,
      });

      if (error) throw error;
      setFeedback({ type: 'success', message: t('admin.restored') });
      await checkAdminAndLoad();
    } catch (err: any) {
      console.error('Restore error:', err);
      setFeedback({ type: 'error', message: err.message || 'Error restoring item' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to permanently delete this job?')) return;

    setActionLoading(jobId);
    setFeedback(null);

    try {
      const { error } = await supabase.from('jobs').delete().eq('id', jobId);
      if (error) throw error;
      setFeedback({ type: 'success', message: 'Job deleted successfully' });
      await checkAdminAndLoad();
    } catch (err: any) {
      console.error('Delete error:', err);
      setFeedback({ type: 'error', message: err.message || 'Error deleting job' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-brand-muted">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs">{t('common.loading')}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="bg-white rounded-3xl border border-brand-border p-8 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-brand-text">
            {language === 'ne' ? 'अनुमति छैन (Access Denied)' : 'Admin Access Denied'}
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted">
            {t('admin.not_admin')}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:bg-primary-hover active:scale-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('nav.home')}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-6 space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-brand-text">
              {t('admin.title')}
            </h1>
            <p className="text-xs text-brand-muted">
              {t('admin.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex rounded-xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setTab('jobs')}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
            tab === 'jobs'
              ? 'bg-white text-primary shadow-xs'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          {t('admin.tab_jobs')} ({flaggedJobs.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('profiles')}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
            tab === 'profiles'
              ? 'bg-white text-primary shadow-xs'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          {t('admin.tab_profiles')} ({flaggedProfiles.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('reports')}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
            tab === 'reports'
              ? 'bg-white text-primary shadow-xs'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          {t('admin.tab_reports')} ({recentReports.length})
        </button>
      </div>

      {/* TAB CONTENT */}
      {tab === 'jobs' && (
        <div className="space-y-3">
          {flaggedJobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-brand-border p-8 text-center text-xs text-brand-muted">
              {t('admin.empty')}
            </div>
          ) : (
            flaggedJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-brand-border p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                      {job.report_count} {t('admin.reports_count')}
                    </span>
                    {job.is_hidden && (
                      <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                        Hidden
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-brand-text">
                    {job.title}
                  </h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    Employer: {job.profiles?.full_name || job.employer_id} •{' '}
                    {formatDualDate(job.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/jobs/${job.id}`}
                    target="_blank"
                    className="p-2 rounded-xl border border-brand-border text-brand-muted hover:text-brand-text"
                    title="View Job"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    disabled={actionLoading === job.id}
                    onClick={() => handleRestore('job', job.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 text-white font-bold text-xs hover:bg-green-700 active:scale-95 transition-all shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('admin.restore')}</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading === job.id}
                    onClick={() => handleDeleteJob(job.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 font-bold text-xs hover:bg-red-100 active:scale-95 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('admin.delete')}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'profiles' && (
        <div className="space-y-3">
          {flaggedProfiles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-brand-border p-8 text-center text-xs text-brand-muted">
              {t('admin.empty')}
            </div>
          ) : (
            flaggedProfiles.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-brand-border p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                      {p.report_count} {t('admin.reports_count')}
                    </span>
                    {p.is_hidden && (
                      <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                        Hidden
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-brand-text">
                    {p.full_name || 'Unnamed Profile'}
                  </h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    User ID: {p.id}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/workers/${p.id}`}
                    target="_blank"
                    className="p-2 rounded-xl border border-brand-border text-brand-muted hover:text-brand-text"
                    title="View Profile"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    disabled={actionLoading === p.id}
                    onClick={() => handleRestore('profile', p.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 text-white font-bold text-xs hover:bg-green-700 active:scale-95 transition-all shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('admin.restore')}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-3">
          {recentReports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-brand-border p-8 text-center text-xs text-brand-muted">
              {t('admin.empty')}
            </div>
          ) : (
            recentReports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white rounded-2xl border border-brand-border p-4 shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full">
                    {rep.reason}
                  </span>
                  <span className="text-[11px] text-brand-muted">
                    {formatDualDate(rep.created_at)}
                  </span>
                </div>

                {rep.details && (
                  <p className="text-brand-text bg-gray-50 p-2.5 rounded-xl border border-brand-border">
                    {rep.details}
                  </p>
                )}

                <div className="flex items-center justify-between text-brand-muted pt-1">
                  <span>
                    Target: {rep.job_id ? `Job: ${rep.job_id}` : `Profile: ${rep.profile_id}`}
                  </span>
                  <span>Reporter: {rep.reporter_id?.substring(0, 8)}...</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
