'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatNepaliPhoneForDisplay, getCallLink, getWhatsAppLink } from '@/lib/utils/phone';
import { formatDualDate } from '@/lib/utils/date';
import ReportModal from '@/components/common/ReportModal';
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  MapPin,
  Calendar,
  Briefcase,
  Phone,
  MessageSquare,
  Flag,
  Share2,
  Lock,
  Image as ImageIcon,
  X,
  ShieldCheck,
} from 'lucide-react';

export default function WorkerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<any>(null);
  const [workerDetails, setWorkerDetails] = useState<any>(null);
  const [contact, setContact] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadWorker() {
      if (!id) return;
      setLoading(true);

      try {
        // 1. Fetch profile with district
        const { data: profData, error: profErr } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            avatar_url,
            rating_avg,
            rating_count,
            completed_jobs,
            tole,
            district_id,
            created_at,
            districts (
              name_ne,
              name_en,
              provinces (
                name_ne,
                name_en
              )
            )
          `)
          .eq('id', id)
          .maybeSingle();

        if (profErr) console.error(profErr);
        if (profData) setProfile(profData);

        // 2. Fetch worker details
        const { data: workerData } = await supabase
          .from('worker_details')
          .select('*')
          .eq('user_id', id)
          .maybeSingle();

        if (workerData) setWorkerDetails(workerData);

        // 3. Try to fetch contact (if shares_context allows)
        const { data: contactData } = await supabase
          .from('profile_contacts')
          .select('phone, whatsapp')
          .eq('user_id', id)
          .maybeSingle();

        if (contactData) setContact(contactData);

        // 4. Fetch reviews received by this worker
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            comment,
            created_at,
            reviewer:reviewer_id (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('reviewee_id', id)
          .order('created_at', { ascending: false });

        if (reviewsData) setReviews(reviewsData);
      } catch (err) {
        console.error('Error loading worker profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadWorker();
  }, [id, supabase]);

  const handleStartChat = async () => {
    if (!user) {
      router.push(`/login?next=/workers/${id}`);
      return;
    }

    try {
      const { data: convId, error } = await supabase.rpc('get_or_create_conversation', {
        other: id,
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

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile?.full_name || 'Worker Profile',
          url,
        });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-brand-muted">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs">{t('common.loading')}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="bg-white rounded-2xl border border-brand-border p-8 shadow-sm space-y-3">
          <h1 className="text-lg font-bold text-brand-text">
            {language === 'ne' ? 'प्रयोगकर्ता भेटिएन' : 'User Not Found'}
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

  const isSelf = user?.id === profile.id;
  const districtName = profile.districts
    ? language === 'ne'
      ? profile.districts.name_ne
      : profile.districts.name_en
    : '';

  const photos: string[] = Array.isArray(workerDetails?.photos) ? workerDetails.photos : [];

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-5">
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-border bg-white text-xs font-bold text-brand-text hover:bg-gray-50 active:scale-95 transition-all shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5 text-primary" />
            <span>{copied ? 'Link Copied!' : t('jobs.share_job')}</span>
          </button>

          {!isSelf && (
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-brand-border bg-white text-xs font-semibold text-red-600 hover:bg-red-50 active:scale-95 transition-all shadow-2xs"
              title={t('reports.button')}
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl border border-brand-border p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-18 h-18 rounded-full bg-primary-light text-primary font-black text-2xl flex items-center justify-center border-2 border-primary/20 flex-shrink-0">
            {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'W'}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-brand-text truncate">
              {profile.full_name}
            </h1>
            {workerDetails?.headline && (
              <p className="text-xs sm:text-sm text-primary font-bold mt-0.5 leading-snug">
                {workerDetails.headline}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-brand-muted mt-1">
              {districtName && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>
                    {profile.tole ? `${profile.tole}, ` : ''}{districtName}
                  </span>
                </span>
              )}
              {workerDetails?.experience_years && (
                <>
                  <span>•</span>
                  <span>
                    {workerDetails.experience_years} {t('workers.years_exp')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-brand-border text-center">
          <div className="p-2.5 rounded-xl bg-brand-bg">
            <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-base">
              <Star className="w-4 h-4 fill-amber-500" />
              <span>{profile.rating_avg || 0}</span>
            </div>
            <span className="text-[11px] text-brand-muted">
              {t('jobs.employer_rating')}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-brand-bg">
            <div className="font-bold text-base text-brand-text">
              {profile.rating_count || 0}
            </div>
            <span className="text-[11px] text-brand-muted">
              {language === 'ne' ? 'प्रतिक्रिया' : 'Reviews'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-brand-bg">
            <div className="flex items-center justify-center gap-1 text-primary font-bold text-base">
              <CheckCircle2 className="w-4 h-4" />
              <span>{profile.completed_jobs || 0}</span>
            </div>
            <span className="text-[11px] text-brand-muted">
              {t('jobs.employer_completed')}
            </span>
          </div>
        </div>

        {/* Skills Tags */}
        {workerDetails?.skills && workerDetails.skills.length > 0 && (
          <div className="pt-2 border-t border-brand-border">
            <h2 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">
              {t('workers.skills')}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {workerDetails.skills.map((slug: string) => (
                <span
                  key={slug}
                  className="text-xs font-semibold px-3 py-1 rounded-xl bg-primary-light text-primary border border-primary/20"
                >
                  {t(`trades.${slug}`, slug)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bio */}
        {workerDetails?.bio && (
          <div className="pt-2 border-t border-brand-border">
            <h2 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">
              {t('workers.about')}
            </h2>
            <p className="text-xs sm:text-sm text-brand-text whitespace-pre-line leading-relaxed">
              {workerDetails.bio}
            </p>
          </div>
        )}

        {/* Contact Numbers / Hidden Hint */}
        <div className="pt-3 border-t border-brand-border">
          {contact?.phone ? (
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <a
                href={getCallLink(contact.phone)}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:bg-primary-hover active:scale-95 transition-all min-h-[44px]"
              >
                <Phone className="w-4 h-4" />
                <span>{t('common.call')}: {formatNepaliPhoneForDisplay(contact.phone)}</span>
              </a>

              {contact.whatsapp && (
                <a
                  href={getWhatsAppLink(contact.whatsapp)}
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
            <div className="p-3 rounded-xl bg-gray-50 border border-brand-border/80 flex items-start gap-2.5 text-xs text-brand-muted">
              <Lock className="w-4 h-4 text-brand-muted flex-shrink-0 mt-0.5" />
              <span>{t('jobs.phone_hidden_hint')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Work Photos Gallery */}
      <div className="bg-white rounded-3xl border border-brand-border p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-brand-text flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          <span>{t('workers.photos')} ({photos.length})</span>
        </h2>

        {photos.length === 0 ? (
          <p className="text-xs text-brand-muted">
            {t('workers.no_photos')}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((src, i) => (
              <div
                key={i}
                onClick={() => setSelectedPhoto(src)}
                className="aspect-square rounded-2xl overflow-hidden border border-brand-border bg-gray-100 cursor-pointer hover:opacity-90 active:scale-98 transition-all relative group"
              >
                <img
                  src={src}
                  alt={`Work photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-lg w-full max-h-[85vh] flex items-center justify-center">
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white p-2 hover:bg-white/20 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedPhoto}
              alt="Work detail"
              className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="bg-white rounded-3xl border border-brand-border p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-brand-text flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>{t('workers.reviews_title')} ({reviews.length})</span>
        </h2>

        {reviews.length === 0 ? (
          <p className="text-xs text-brand-muted">
            {t('workers.no_reviews')}
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl border border-brand-border bg-brand-bg/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary-light text-primary font-bold text-xs flex items-center justify-center">
                      {rev.reviewer?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-xs font-bold text-brand-text">
                      {rev.reviewer?.full_name || 'Client'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                </div>

                {rev.comment && (
                  <p className="text-xs text-brand-text leading-relaxed">
                    {rev.comment}
                  </p>
                )}

                <span className="text-[10px] text-brand-muted block">
                  {formatDualDate(rev.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat CTA Sticky Bottom Bar */}
      {!isSelf && (
        <div className="sticky bottom-18 sm:bottom-4 z-30 pt-2">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-brand-border p-3 shadow-lg">
            <button
              type="button"
              onClick={handleStartChat}
              className="w-full py-3.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <MessageSquare className="w-5 h-5" />
              <span>{t('workers.chat_cta')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        targetType="profile"
        targetId={profile.id}
        targetTitle={profile.full_name}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}
