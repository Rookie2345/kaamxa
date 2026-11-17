'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatNepaliPhoneForDisplay, getCallLink, getWhatsAppLink } from '@/lib/utils/phone';
import { formatDualDate } from '@/lib/utils/date';
import {
  ArrowLeft,
  Users,
  Star,
  CheckCircle2,
  Phone,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  UserCheck,
  AlertCircle,
  Briefcase,
  HelpCircle,
} from 'lucide-react';
import type { Database, AppStatus } from '@/types/database.types';

export default function JobApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [job, setJob] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, any[]>>({});
  const [loadingAnswers, setLoadingAnswers] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    if (!id || !user) return;
    setLoading(true);

    try {
      // 1. Fetch job
      const { data: jobData, error: jobErr } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (jobErr) throw jobErr;
      if (!jobData) return;

      setJob(jobData);

      // Verify ownership
      if (jobData.employer_id !== user.id) {
        return;
      }

      // 2. Fetch applications with profiles and contacts
      const { data: appsData, error: appsErr } = await supabase
        .from('applications')
        .select(`
          id,
          job_id,
          applicant_id,
          status,
          message,
          score,
          max_score,
          created_at,
          profiles:applicant_id (
            id,
            full_name,
            avatar_url,
            rating_avg,
            rating_count,
            completed_jobs,
            tole,
            district_id
          )
        `)
        .eq('job_id', id)
        .order('score', { ascending: false })
        .order('created_at', { ascending: false });

      if (appsErr) throw appsErr;

      // Also fetch contacts for these applicants (shares_context allows this)
      if (appsData && appsData.length > 0) {
        const applicantIds = appsData.map((a: any) => a.applicant_id);
        const { data: contactsData } = await supabase
          .from('profile_contacts')
          .select('user_id, phone, whatsapp')
          .in('user_id', applicantIds);

        const contactMap: Record<string, { phone: string; whatsapp: string | null }> = {};
        if (contactsData) {
          contactsData.forEach((c: any) => {
            contactMap[c.user_id] = { phone: c.phone, whatsapp: c.whatsapp };
          });
        }

        const enriched = appsData.map((a: any) => ({
          ...a,
          contact: contactMap[a.applicant_id] || null,
        }));

        setApplicants(enriched);
      } else {
        setApplicants([]);
      }
    } catch (err: any) {
      console.error('Error loading applicants:', err);
      setErrorMsg(err.message || 'Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, user]);

  const toggleAnswers = async (appId: string) => {
    if (expandedAnswers[appId]) {
      setExpandedAnswers((prev) => {
        const copy = { ...prev };
        delete copy[appId];
        return copy;
      });
      return;
    }

    setLoadingAnswers((prev) => ({ ...prev, [appId]: true }));
    try {
      const { data, error } = await supabase
        .from('application_answers')
        .select(`
          id,
          answer_text,
          answer_index,
          is_correct,
          job_questions (
            question,
            kind,
            options
          )
        `)
        .eq('application_id', appId);

      if (error) throw error;
      setExpandedAnswers((prev) => ({ ...prev, [appId]: data || [] }));
    } catch (err) {
      console.error('Error fetching answers:', err);
    } finally {
      setLoadingAnswers((prev) => ({ ...prev, [appId]: false }));
    }
  };

  const handleUpdateStatus = async (appId: string, newStatus: AppStatus) => {
    setActionLoading(appId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', appId);

      if (error) throw error;
      await loadData();
    } catch (err: any) {
      console.error('Status update error:', err);
      setErrorMsg(err.message || 'Could not update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleHire = async (appId: string) => {
    if (!confirm(t('applicants.confirm_hire_desc'))) return;

    setActionLoading(appId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.rpc('hire_applicant', {
        app_id: appId,
      });

      if (error) throw error;
      setSuccessMsg(t('applicants.hire_success'));
      await loadData();
    } catch (err: any) {
      console.error('Hire error:', err);
      setErrorMsg(err.message || 'Could not complete hire');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartChat = async (applicantId: string) => {
    try {
      const { data: convId, error } = await supabase.rpc('get_or_create_conversation', {
        other: applicantId,
        for_job: id,
      });

      if (error) throw error;
      if (convId) {
        router.push(`/chat/${convId}`);
      }
    } catch (err: any) {
      console.error('Chat creation error:', err);
      setErrorMsg(err.message || 'Could not start chat');
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

  if (!user || (job && job.employer_id !== user.id)) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="bg-white rounded-2xl border border-brand-border p-8 shadow-sm space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h1 className="text-lg font-bold text-brand-text">
            {language === 'ne' ? 'अनुमति छैन' : 'Access Denied'}
          </h1>
          <p className="text-xs text-brand-muted">
            {language === 'ne'
              ? 'यो कामको आवेदनहरू केवल काम पोस्ट गर्ने व्यक्तिले मात्र हेर्न सक्छ।'
              : 'Only the employer who posted this job can view the applicants.'}
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
          >
            <span>{t('jobs.all_jobs')}</span>
          </Link>
        </div>
      </div>
    );
  }

  const positionsAvailable = job?.positions || 1;
  const positionsFilled = job?.filled || 0;
  const isFullyFilled = positionsFilled >= positionsAvailable;

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-5">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href={`/jobs/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{job.title}</span>
        </Link>
      </div>

      {/* Header Info */}
      <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-xs space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-brand-text">
              {job.title}
            </h1>
            <p className="text-xs text-brand-muted mt-0.5">
              {t('jobs.posted')}: {formatDualDate(job.created_at)}
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold ${
              isFullyFilled
                ? 'bg-gray-100 text-gray-700'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {positionsFilled} / {positionsAvailable} {t('applicants.hired')}
          </span>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Applicants List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-brand-text uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>{t('applicants.title')} ({applicants.length})</span>
          </h2>
        </div>

        {applicants.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-border p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-brand-bg text-brand-muted mx-auto flex items-center justify-center">
              <Users className="w-7 h-7 text-primary/60" />
            </div>
            <h3 className="text-base font-bold text-brand-text">
              {t('applicants.empty')}
            </h3>
            <p className="text-xs text-brand-muted max-w-sm mx-auto">
              {language === 'ne'
                ? 'कामदारहरूले आवेदन दिएपछि तिनीहरूको विवरण र परीक्षाको अङ्क यहाँ देखिनेछ।'
                : 'When workers apply, their profile and screening score will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applicants.map((app) => {
              const profile = app.profiles;
              const contact = app.contact;
              const hasScore = app.max_score > 0;
              const isHired = app.status === 'hired';
              const isShortlisted = app.status === 'shortlisted';
              const isRejected = app.status === 'rejected';

              return (
                <div
                  key={app.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs space-y-4 transition-all ${
                    isHired
                      ? 'border-green-300 ring-1 ring-green-200 bg-green-50/20'
                      : 'border-brand-border'
                  }`}
                >
                  {/* Top: Avatar, Name, Stats, Score */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary-light text-primary font-bold text-lg flex items-center justify-center border border-primary/20 flex-shrink-0">
                        {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'W'}
                      </div>
                      <div>
                        <Link
                          href={`/workers/${app.applicant_id}`}
                          className="font-bold text-brand-text hover:text-primary transition-colors text-sm sm:text-base flex items-center gap-1.5"
                        >
                          <span>{profile?.full_name || 'Worker'}</span>
                        </Link>
                        <div className="flex items-center gap-3 text-xs text-brand-muted mt-0.5">
                          <div className="flex items-center gap-1 text-amber-600 font-semibold">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>{profile?.rating_avg || 0}</span>
                            <span className="text-brand-muted font-normal">
                              ({profile?.rating_count || 0})
                            </span>
                          </div>
                          <span>•</span>
                          <span>
                            {profile?.completed_jobs || 0} {t('jobs.employer_completed')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Score Badges */}
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase ${
                          isHired
                            ? 'bg-green-100 text-green-800'
                            : isShortlisted
                            ? 'bg-blue-100 text-blue-800'
                            : isRejected
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {t(`applicants.status_${app.status}`)}
                      </span>

                      {hasScore && (
                        <div className="inline-flex items-center gap-1 text-xs font-extrabold px-2 py-0.5 rounded-lg bg-primary-light text-primary border border-primary/20">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>
                            {app.score}/{app.max_score}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Applicant Cover Message */}
                  {app.message && (
                    <div className="p-3 rounded-xl bg-gray-50 border border-brand-border text-xs text-brand-text leading-relaxed">
                      <span className="font-bold text-brand-muted block mb-0.5">
                        {language === 'ne' ? 'कामदारको सन्देश:' : 'Applicant Message:'}
                      </span>
                      {app.message}
                    </div>
                  )}

                  {/* Contact Buttons (revealed via shares_context) */}
                  {contact?.phone && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-brand-border">
                      <a
                        href={getCallLink(contact.phone)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white font-bold text-xs shadow-2xs hover:bg-primary-hover active:scale-95 transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{formatNepaliPhoneForDisplay(contact.phone)}</span>
                      </a>

                      {contact.whatsapp && (
                        <a
                          href={getWhatsAppLink(contact.whatsapp, `Namaste, regarding your KaamXa application for "${job.title}"`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366] text-white font-bold text-xs shadow-2xs hover:opacity-95 active:scale-95 transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{t('common.whatsapp')}</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleStartChat(app.applicant_id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-brand-border bg-white text-brand-text font-bold text-xs hover:bg-gray-50 active:scale-95 transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-primary" />
                        <span>{t('chat.title')}</span>
                      </button>
                    </div>
                  )}

                  {/* Screening Answers Accordion */}
                  <div className="border-t border-brand-border pt-2">
                    <button
                      type="button"
                      onClick={() => toggleAnswers(app.id)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>
                        {expandedAnswers[app.id]
                          ? t('applicants.hide_answers')
                          : t('applicants.view_answers')}
                      </span>
                      {expandedAnswers[app.id] ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {loadingAnswers[app.id] && (
                      <p className="text-xs text-brand-muted mt-2">{t('common.loading')}</p>
                    )}

                    {expandedAnswers[app.id] && (
                      <div className="mt-3 space-y-2.5">
                        {expandedAnswers[app.id].length === 0 ? (
                          <p className="text-xs text-brand-muted">
                            {language === 'ne'
                              ? 'कुनै प्रश्नको उत्तर पेश गरिएको छैन।'
                              : 'No answers recorded for this applicant.'}
                          </p>
                        ) : (
                          expandedAnswers[app.id].map((ans: any, aIdx: number) => {
                            const q = ans.job_questions;
                            const options = Array.isArray(q?.options) ? q.options : [];
                            const chosenOption =
                              ans.answer_index !== null && ans.answer_index !== undefined
                                ? options[ans.answer_index]
                                : null;

                            return (
                              <div
                                key={ans.id}
                                className="p-3 rounded-xl bg-gray-50 border border-brand-border text-xs space-y-1.5"
                              >
                                <p className="font-bold text-brand-text">
                                  {aIdx + 1}. {q?.question}
                                </p>
                                {q?.kind === 'mcq' ? (
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-brand-text">
                                      {language === 'ne' ? 'दिएको उत्तर:' : 'Answer:'}{' '}
                                      {chosenOption || `Option #${ans.answer_index + 1}`}
                                    </span>
                                    {ans.is_correct ? (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-100 text-green-800">
                                        ✓ Correct
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-800">
                                        ✗ Incorrect
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-brand-text whitespace-pre-line bg-white p-2 rounded-lg border border-brand-border">
                                    {ans.answer_text || (
                                      <span className="text-brand-muted italic">
                                        {language === 'ne' ? 'खाली' : 'Blank'}
                                      </span>
                                    )}
                                  </p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-brand-border">
                    {!isHired && (
                      <>
                        {!isShortlisted && (
                          <button
                            type="button"
                            disabled={actionLoading === app.id}
                            onClick={() => handleUpdateStatus(app.id, 'shortlisted')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-brand-border bg-white text-brand-text font-bold text-xs hover:bg-gray-50 active:scale-95 transition-all"
                          >
                            <Check className="w-3.5 h-3.5 text-blue-600" />
                            <span>{t('applicants.shortlist')}</span>
                          </button>
                        )}

                        {!isRejected && (
                          <button
                            type="button"
                            disabled={actionLoading === app.id}
                            onClick={() => handleUpdateStatus(app.id, 'rejected')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-brand-border bg-white text-red-600 font-bold text-xs hover:bg-red-50 active:scale-95 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{t('applicants.reject')}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={actionLoading === app.id || isFullyFilled}
                          onClick={() => handleHire(app.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white font-extrabold text-xs shadow-sm hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-50"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>{t('applicants.hire')}</span>
                        </button>
                      </>
                    )}

                    {isHired && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-xl">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t('applicants.hired')}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
