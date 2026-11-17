'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatPay } from '@/lib/utils/pay';
import { formatDualDate, formatRelativeTime } from '@/lib/utils/date';
import { formatNepaliPhoneForDisplay, getCallLink, getWhatsAppLink } from '@/lib/utils/phone';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  Star,
  CheckCircle2,
  Phone,
  MessageSquare,
  Share2,
  Flag,
  Briefcase,
  Lock,
  ChevronRight,
  Send,
} from 'lucide-react';
import type { Database } from '@/types/database.types';

type JobDetail = Database['public']['Tables']['jobs']['Row'] & {
  districts?: {
    name_ne: string;
    name_en: string;
    provinces?: {
      name_ne: string;
      name_en: string;
    } | null;
  } | null;
  profiles?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    rating_avg: number;
    rating_count: number;
    completed_jobs: number;
  } | null;
};

type ContactDetail = {
  phone: string;
  whatsapp: string | null;
} | null;

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [contact, setContact] = useState<ContactDetail>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadJob() {
      if (!id) return;
      setLoading(true);

      try {
        // Fetch job with district and employer profile
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select(`
            *,
            districts (
              name_ne,
              name_en,
              provinces (
                name_ne,
                name_en
              )
            ),
            profiles:employer_id (
              id,
              full_name,
              avatar_url,
              rating_avg,
              rating_count,
              completed_jobs
            )
          `)
          .eq('id', id)
          .maybeSingle();

        if (jobError) {
          console.error('Job query error:', jobError);
        } else if (jobData) {
          setJob(jobData as any);

          // Try to fetch employer contact (enforced by shares_context RLS in database)
          const { data: contactData } = await supabase
            .from('profile_contacts')
            .select('phone, whatsapp')
            .eq('user_id', jobData.employer_id)
            .maybeSingle();

          if (contactData) {
            setContact(contactData);
          }

          // Check if current user has already applied
          if (user) {
            const { data: appData } = await supabase
              .from('applications')
              .select('id')
              .eq('job_id', id)
              .eq('applicant_id', user.id)
              .maybeSingle();

            if (appData) {
              setHasApplied(true);
            }
          }
        }
      } catch (err) {
        console.error('Error loading job details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadJob();
  }, [id, user, supabase]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: job?.title || 'KaamXa Job',
          text: `${job?.title} - KaamXa (काम छ)`,
          url,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyClick = () => {
    if (!user) {
      router.push(`/login?next=/jobs/${id}`);
      return;
    }
    // Link to application / screening flow (Phase 3)
    router.push(`/jobs/${id}/apply`);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-brand-muted">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs">{t('common.loading')}</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="bg-white rounded-3xl border border-brand-border p-8 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-bg text-brand-muted mx-auto flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-brand-muted" />
          </div>
          <h1 className="text-xl font-bold text-brand-text">
            {language === 'ne' ? 'यो काम फेला परेन' : 'Job Not Found'}
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted">
            {language === 'ne'
              ? 'यो काम बन्द भइसकेको वा हटाइएको हुन सक्छ।'
              : 'This job may have expired, been filled, or removed.'}
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:bg-primary-hover active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('jobs.all_jobs')}</span>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === job.employer_id;
  const districtName = job.districts
    ? language === 'ne'
      ? job.districts.name_ne
      : job.districts.name_en
    : `District #${job.district_id}`;

  const provinceName = job.districts?.provinces
    ? language === 'ne'
      ? job.districts.provinces.name_ne
      : job.districts.provinces.name_en
    : '';

  const tradeName = t(`trades.${job.trade_slug}`, job.trade_slug);
  const payFormatted = formatPay(job.pay_type, job.pay_min, job.pay_max, job.negotiable, language);

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-5">
      {/* Top Navigation & Share */}
      <div className="flex items-center justify-between">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('jobs.all_jobs')}</span>
        </Link>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-border bg-white text-xs font-bold text-brand-text hover:bg-gray-50 active:scale-95 transition-all shadow-2xs"
        >
          <Share2 className="w-3.5 h-3.5 text-primary" />
          <span>{copied ? (language === 'ne' ? 'लिङ्क कपी भयो!' : 'Link Copied!') : t('jobs.share_job')}</span>
        </button>
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl border border-brand-border p-5 sm:p-7 shadow-xs space-y-5">
        {/* Trade & Pay Row */}
        <div className="flex items-start justify-between gap-3">
          <span className="inline-block text-xs font-bold px-3 py-1 rounded-xl bg-primary-light text-primary border border-primary/20">
            {tradeName}
          </span>

          <div className="text-right">
            <span className="text-sm sm:text-base font-extrabold text-primary block">
              {payFormatted}
            </span>
          </div>
        </div>

        {/* Job Title */}
        <h1 className="text-xl sm:text-2xl font-black text-brand-text leading-snug">
          {job.title}
        </h1>

        {/* Location & Positions Badges */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-brand-bg/70 border border-brand-border/70 text-xs text-brand-text">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <div>
              <span className="block text-[10px] uppercase font-bold text-brand-muted">
                {t('jobs.location')}
              </span>
              <span className="font-bold">
                {job.tole ? `${job.tole}, ` : ''}{districtName}
                {provinceName ? ` (${provinceName})` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary flex-shrink-0" />
            <div>
              <span className="block text-[10px] uppercase font-bold text-brand-muted">
                {t('post_job.positions')}
              </span>
              <span className="font-bold">
                {job.positions} {t('jobs.positions_available')}
                {job.filled > 0 && ` (${job.filled} ${t('jobs.positions_filled')})`}
              </span>
            </div>
          </div>
        </div>

        {/* Dates row: Posted & Expiry in Bikram Sambat & AD */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-brand-muted border-t border-brand-border/70 pt-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>
              <strong className="text-brand-text font-medium">{t('jobs.posted')}:</strong>{' '}
              {formatDualDate(job.created_at)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span>
              <strong className="text-brand-text font-medium">{t('jobs.expires')}:</strong>{' '}
              {formatDualDate(job.expires_at)}
            </span>
          </div>
        </div>

        {/* Job Description */}
        <div className="border-t border-brand-border pt-4">
          <h2 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
            {t('post_job.description')}
          </h2>
          <div className="text-sm text-brand-text whitespace-pre-line leading-relaxed">
            {job.description || (
              <span className="text-brand-muted italic">
                {language === 'ne' ? 'थप विवरण उपलब्ध छैन।' : 'No additional description provided.'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Safety Warning Card */}
      <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-accent/25 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-accent flex-shrink-0" />
        <p className="text-xs font-semibold text-brand-text leading-snug">
          {t('common.safety_warning')}
        </p>
      </div>

      {/* Employer Profile & Contact Card */}
      <div className="bg-white rounded-3xl border border-brand-border p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-brand-muted uppercase tracking-wider">
          {t('jobs.employer_info')}
        </h2>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-light text-primary font-bold text-lg flex items-center justify-center border border-primary/20">
              {job.profiles?.full_name ? job.profiles.full_name.charAt(0).toUpperCase() : 'E'}
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-text">
                {job.profiles?.full_name || 'KaamXa Employer'}
              </h3>
              <div className="flex items-center gap-3 text-xs text-brand-muted mt-0.5">
                <div className="flex items-center gap-1 text-amber-600 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{job.profiles?.rating_avg || 0}</span>
                  <span className="text-brand-muted font-normal">
                    ({job.profiles?.rating_count || 0})
                  </span>
                </div>
                <span>•</span>
                <span>
                  {job.profiles?.completed_jobs || 0} {t('jobs.employer_completed')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Numbers / Hidden Hint */}
        <div className="pt-3 border-t border-brand-border">
          {contact?.phone ? (
            /* Contact revealed because user is owner or shares context */
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <a
                href={getCallLink(contact.phone)}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:bg-primary-hover active:scale-95 transition-all min-h-[44px]"
              >
                <Phone className="w-4 h-4" />
                <span>{t('common.call')}: {formatNepaliPhoneForDisplay(contact.phone)}</span>
              </a>

              {contact.whatsapp && (
                <a
                  href={getWhatsAppLink(contact.whatsapp, `Namaste, I am contacting you regarding your KaamXa job: "${job.title}"`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366] text-white font-bold text-xs shadow-sm hover:opacity-95 active:scale-95 transition-all min-h-[44px]"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t('common.whatsapp')}</span>
                </a>
              )}
            </div>
          ) : (
            /* Contact hidden by database security */
            <div className="p-3.5 rounded-xl bg-gray-50 border border-brand-border/80 flex items-start gap-2.5 text-xs text-brand-muted">
              <Lock className="w-4 h-4 text-brand-muted flex-shrink-0 mt-0.5" />
              <span>{t('jobs.phone_hidden_hint')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action CTA Bar */}
      <div className="sticky bottom-18 sm:bottom-4 z-30 pt-2">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-brand-border p-3 shadow-lg flex items-center justify-between gap-3">
          {isOwner ? (
            <Link
              href="/my-jobs"
              className="w-full py-3.5 px-4 rounded-xl bg-primary text-white font-bold text-sm text-center shadow-sm hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Users className="w-4 h-4" />
              <span>{t('jobs.manage_job')}</span>
            </Link>
          ) : hasApplied ? (
            <div className="w-full py-3.5 px-4 rounded-xl bg-green-50 border border-green-200 text-green-800 font-bold text-sm text-center flex items-center justify-center gap-2 min-h-[48px]">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span>{t('jobs.already_applied')}</span>
            </div>
          ) : job.status !== 'open' ? (
            <div className="w-full py-3.5 px-4 rounded-xl bg-gray-100 text-brand-muted font-bold text-sm text-center min-h-[48px] flex items-center justify-center">
              <span>{t('jobs.job_closed')}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleApplyClick}
              className="w-full py-3.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-extrabold text-base shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Send className="w-5 h-5" />
              <span>{t('jobs.apply_now')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
