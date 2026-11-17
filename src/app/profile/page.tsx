'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { formatNepaliPhoneForDisplay } from '@/lib/utils/phone';
import {
  User as UserIcon,
  Phone,
  MapPin,
  Star,
  CheckCircle2,
  Settings,
  LogOut,
  LogIn,
  Shield,
  Briefcase,
  ChevronRight,
} from 'lucide-react';

export default function ProfilePage() {
  const { t, language } = useLanguage();
  const { user, profile, contact, workerDetails, signOut } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="bg-white rounded-2xl border border-brand-border p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-primary-light text-primary mx-auto flex items-center justify-center mb-4">
            <UserIcon className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-brand-text mb-2">
            {t('auth.login_title')}
          </h1>
          <p className="text-sm text-brand-muted mb-6">
            {t('auth.login_required_desc')}
          </p>
          <Link
            href="/login?next=/profile"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-accent text-white font-bold text-sm shadow-sm hover:bg-accent-hover active:scale-95 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>{t('nav.login')}</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="max-w-xl mx-auto py-4 sm:py-8 space-y-5">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-light text-primary font-black text-2xl flex items-center justify-center border-2 border-primary/20 flex-shrink-0">
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'K'}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-brand-text truncate">
              {profile?.full_name || 'KaamXa User'}
            </h1>
            {workerDetails?.headline && (
              <p className="text-xs text-primary font-semibold mt-0.5 truncate">
                {workerDetails.headline}
              </p>
            )}
            <p className="text-xs text-brand-muted mt-1 truncate">
              {user.email}
            </p>
          </div>

          {profile?.is_admin && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
              <Shield className="w-3.5 h-3.5" />
              Admin
            </span>
          )}
        </div>

        {/* Stats Row: Rating, Reviews, Completed Jobs */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-brand-border text-center">
          <div className="p-2 rounded-xl bg-brand-bg">
            <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-base">
              <Star className="w-4 h-4 fill-amber-500" />
              <span>{profile?.rating_avg || 0}</span>
            </div>
            <span className="text-[11px] text-brand-muted">
              {language === 'ne' ? 'औसत मूल्याङ्कन' : 'Rating Avg'}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-brand-bg">
            <div className="font-bold text-base text-brand-text">
              {profile?.rating_count || 0}
            </div>
            <span className="text-[11px] text-brand-muted">
              {language === 'ne' ? 'प्रतिक्रिया' : 'Reviews'}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-brand-bg">
            <div className="flex items-center justify-center gap-1 text-primary font-bold text-base">
              <CheckCircle2 className="w-4 h-4" />
              <span>{profile?.completed_jobs || 0}</span>
            </div>
            <span className="text-[11px] text-brand-muted">
              {language === 'ne' ? 'सम्पन्न काम' : 'Completed'}
            </span>
          </div>
        </div>
      </div>

      {/* Details & Contacts */}
      <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-brand-muted uppercase tracking-wider">
          {language === 'ne' ? 'सम्पर्क तथा ठेगाना' : 'Contact & Location'}
        </h2>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-brand-text font-medium">
              {contact?.phone ? formatNepaliPhoneForDisplay(contact.phone) : (
                <span className="text-brand-muted text-xs">
                  {language === 'ne' ? 'नम्बर राखिएको छैन' : 'No phone added'}
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-brand-text font-medium">
              {profile?.tole ? `${profile.tole}, ` : ''}
              {profile?.district_id ? `District #${profile.district_id}` : (
                <span className="text-brand-muted text-xs">
                  {language === 'ne' ? 'जिल्ला छानिएको छैन' : 'No district set'}
                </span>
              )}
            </span>
          </div>

          {workerDetails?.skills && workerDetails.skills.length > 0 && (
            <div className="pt-2">
              <span className="text-xs text-brand-muted block mb-1.5 font-medium">
                {language === 'ne' ? 'सीपहरू' : 'Skills'}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {workerDetails.skills.map((slug) => (
                  <span
                    key={slug}
                    className="text-xs font-semibold bg-primary-light text-primary px-2.5 py-1 rounded-lg"
                  >
                    {t(`trades.${slug}`)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-brand-border divide-y divide-brand-border shadow-sm overflow-hidden">
        <Link
          href={`/workers/${user.id}`}
          className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3 text-sm font-semibold text-brand-text">
            <UserIcon className="w-5 h-5 text-primary" />
            <span>{language === 'ne' ? 'मेरो सार्वजनिक प्रोफाइल हेर्नुहोस्' : 'View Public Profile'}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-brand-muted" />
        </Link>

        <Link
          href="/profile/setup"
          className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3 text-sm font-semibold text-brand-text">
            <Settings className="w-5 h-5 text-primary" />
            <span>{language === 'ne' ? 'प्रोफाइल सम्पादन गर्नुहोस्' : 'Edit Profile'}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-brand-muted" />
        </Link>

        {profile?.is_admin && (
          <Link
            href="/admin"
            className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3 text-sm font-semibold text-amber-700">
              <Shield className="w-5 h-5 text-amber-600" />
              <span>{t('nav.admin')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-brand-muted" />
          </Link>
        )}

        <button
          onClick={handleLogout}
          type="button"
          className="w-full flex items-center justify-between p-4 hover:bg-red-50 active:bg-red-100 transition-colors text-left"
        >
          <div className="flex items-center gap-3 text-sm font-semibold text-red-600">
            <LogOut className="w-5 h-5" />
            <span>{t('nav.logout')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-red-300" />
        </button>
      </div>
    </div>
  );
}
