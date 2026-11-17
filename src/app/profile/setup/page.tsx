'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { isValidNepaliPhone, cleanNepaliPhone } from '@/lib/utils/phone';
import { UserCheck, AlertCircle, CheckCircle2, ChevronRight, Phone, MapPin, Wrench } from 'lucide-react';

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

// Fallback seed data in case Supabase schema is not yet executed in database
const FALLBACK_PROVINCES: Province[] = [
  { id: 1, name_en: 'Koshi', name_ne: 'कोशी' },
  { id: 2, name_en: 'Madhesh', name_ne: 'मधेश' },
  { id: 3, name_en: 'Bagmati', name_ne: 'बागमती' },
  { id: 4, name_en: 'Gandaki', name_ne: 'गण्डकी' },
  { id: 5, name_en: 'Lumbini', name_ne: 'लुम्बिनी' },
  { id: 6, name_en: 'Karnali', name_ne: 'कर्णाली' },
  { id: 7, name_en: 'Sudurpashchim', name_ne: 'सुदूरपश्चिम' },
];

const FALLBACK_DISTRICTS: District[] = [
  { id: 14, province_id: 1, name_en: 'Morang', name_ne: 'मोरङ' },
  { id: 19, province_id: 1, name_en: 'Sunsari', name_ne: 'सुनसरी' },
  { id: 4, province_id: 1, name_en: 'Jhapa', name_ne: 'झापा' },
  { id: 27, province_id: 3, name_en: 'Kathmandu', name_ne: 'काठमाडौं' },
  { id: 25, province_id: 3, name_en: 'Lalitpur', name_ne: 'ललितपुर' },
  { id: 26, province_id: 3, name_en: 'Bhaktapur', name_ne: 'भक्तपुर' },
  { id: 32, province_id: 3, name_en: 'Chitwan', name_ne: 'चितवन' },
  { id: 37, province_id: 4, name_en: 'Kaski', name_ne: 'कास्की' },
  { id: 47, province_id: 5, name_en: 'Rupandehi', name_ne: 'रुपन्देही' },
  { id: 53, province_id: 5, name_en: 'Banke', name_ne: 'बाँके' },
  { id: 62, province_id: 6, name_en: 'Surkhet', name_ne: 'सुर्खेत' },
  { id: 65, province_id: 7, name_en: 'Kailali', name_ne: 'कैलाली' },
];

const FALLBACK_TRADES: Trade[] = [
  { slug: 'electrician', name_en: 'Electrician', name_ne: 'बिजुली मिस्त्री' },
  { slug: 'plumber', name_en: 'Plumber', name_ne: 'प्लम्बर' },
  { slug: 'carpenter', name_en: 'Carpenter', name_ne: 'सिकर्मी' },
  { slug: 'mason', name_en: 'Mason', name_ne: 'डकर्मी' },
  { slug: 'painter', name_en: 'Painter', name_ne: 'रङ्गरोगन गर्ने' },
  { slug: 'welder', name_en: 'Welder', name_ne: 'वेल्डर' },
  { slug: 'tailor', name_en: 'Tailor', name_ne: 'दर्जी' },
  { slug: 'driver', name_en: 'Driver', name_ne: 'चालक' },
  { slug: 'cook', name_en: 'Cook', name_ne: 'भान्से' },
  { slug: 'helper', name_en: 'Helper / Labourer', name_ne: 'हेल्पर / मजदुर' },
  { slug: 'farm-worker', name_en: 'Farm worker', name_ne: 'कृषि मजदुर' },
  { slug: 'mechanic', name_en: 'Mechanic', name_ne: 'मेकानिक' },
  { slug: 'shop-assistant', name_en: 'Shop assistant', name_ne: 'पसलको सहयोगी' },
  { slug: 'security-guard', name_en: 'Security guard', name_ne: 'सुरक्षा गार्ड' },
  { slug: 'cleaner', name_en: 'Cleaner', name_ne: 'सरसफाइ कर्मचारी' },
  { slug: 'delivery-rider', name_en: 'Delivery rider', name_ne: 'डेलिभरी राइडर' },
  { slug: 'tutor', name_en: 'Tutor', name_ne: 'शिक्षक / ट्युटर' },
  { slug: 'data-entry', name_en: 'Data entry', name_ne: 'डेटा एन्ट्री' },
];

export default function ProfileSetupPage() {
  const { t, language } = useLanguage();
  const { user, profile, contact, workerDetails, refreshProfile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [provinces, setProvinces] = useState<Province[]>(FALLBACK_PROVINCES);
  const [districts, setDistricts] = useState<District[]>(FALLBACK_DISTRICTS);
  const [trades, setTrades] = useState<Trade[]>(FALLBACK_TRADES);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | ''>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | ''>('');
  const [tole, setTole] = useState('');
  const [headline, setHeadline] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState<number | ''>('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Prepopulate existing data
  useEffect(() => {
    if (profile) {
      if (profile.full_name) setFullName(profile.full_name);
      if (profile.district_id) setSelectedDistrictId(profile.district_id);
      if (profile.tole) setTole(profile.tole);
    }
    if (contact) {
      if (contact.phone) setPhone(cleanNepaliPhone(contact.phone));
      if (contact.whatsapp) setWhatsapp(cleanNepaliPhone(contact.whatsapp));
    }
    if (workerDetails) {
      if (workerDetails.headline) setHeadline(workerDetails.headline);
      if (workerDetails.skills) setSkills(workerDetails.skills);
      if (workerDetails.experience_years !== null) setExperienceYears(workerDetails.experience_years);
    }
  }, [profile, contact, workerDetails]);

  // Load provinces, districts, and trades from DB
  useEffect(() => {
    async function loadData() {
      const [provRes, distRes, tradeRes] = await Promise.all([
        supabase.from('provinces').select('*').order('id'),
        supabase.from('districts').select('*').order('name_en'),
        supabase.from('trades').select('*').order('sort'),
      ]);

      if (provRes.data && provRes.data.length > 0) setProvinces(provRes.data);
      if (distRes.data && distRes.data.length > 0) setDistricts(distRes.data);
      if (tradeRes.data && tradeRes.data.length > 0) setTrades(tradeRes.data);
    }
    loadData();
  }, [supabase]);

  // Sync selected province when district changes
  useEffect(() => {
    if (selectedDistrictId && districts.length > 0) {
      const dist = districts.find((d) => d.id === Number(selectedDistrictId));
      if (dist) {
        setSelectedProvinceId(dist.province_id);
      }
    }
  }, [selectedDistrictId, districts]);

  const filteredDistricts = selectedProvinceId
    ? districts.filter((d) => d.province_id === Number(selectedProvinceId))
    : districts;

  const toggleSkill = (slug: string) => {
    setSkills((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!user) {
      router.push('/login?next=/profile/setup');
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg(language === 'ne' ? 'कृपया पूरा नाम लेख्नुहोस्।' : 'Please enter your full name.');
      return;
    }

    const cleanPhone = cleanNepaliPhone(phone);
    if (!isValidNepaliPhone(cleanPhone)) {
      setErrorMsg(
        language === 'ne'
          ? 'कृपया मान्य नेपाली मोबाइल नम्बर लेख्नुहोस् (९८ वा ९७ बाट सुरु हुने १० अंक)।'
          : 'Please enter a valid Nepali mobile number (10 digits starting with 98 or 97).'
      );
      return;
    }

    if (whatsapp && !isValidNepaliPhone(cleanNepaliPhone(whatsapp))) {
      setErrorMsg(
        language === 'ne'
          ? 'कृपया मान्य नेपाली व्हाट्सएप नम्बर लेख्नुहोस्।'
          : 'Please enter a valid Nepali WhatsApp number.'
      );
      return;
    }

    if (!selectedDistrictId) {
      setErrorMsg(language === 'ne' ? 'कृपया जिल्ला छान्नुहोस्।' : 'Please select your district.');
      return;
    }

    setSaving(true);

    try {
      // 1. UPDATE profiles table (created automatically by trigger)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          district_id: Number(selectedDistrictId),
          tole: tole.trim() || null,
          language: language,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. UPSERT profile_contacts table (phone, whatsapp)
      const { error: contactError } = await supabase
        .from('profile_contacts')
        .upsert({
          user_id: user.id,
          phone: cleanPhone,
          whatsapp: whatsapp ? cleanNepaliPhone(whatsapp) : null,
        });

      if (contactError) throw contactError;

      // 3. UPSERT worker_details table (skills, headline, experience_years)
      const { error: workerError } = await supabase
        .from('worker_details')
        .upsert({
          user_id: user.id,
          headline: headline.trim() || null,
          skills: skills,
          experience_years: experienceYears !== '' ? Number(experienceYears) : null,
          available: true,
        });

      if (workerError) throw workerError;

      await refreshProfile();
      setSuccessMsg(t('profile_setup.success'));

      setTimeout(() => {
        router.push('/');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(t('profile_setup.error') + (err.message || 'Error occurred'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8">
      <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-5 sm:p-8">
        {/* Title */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-brand-border">
          <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-brand-text">
              {t('profile_setup.title')}
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted">
              {t('profile_setup.subtitle')}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Basic Info */}
          <div>
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
              व्यक्तिगत विवरण (Personal Info)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-text uppercase mb-1">
                  {t('profile_setup.full_name')} *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="जस्तै: राम बहादुर थापा"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border focus:ring-2 focus:ring-primary focus:outline-none text-sm min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-text uppercase mb-1">
                    <Phone className="w-3.5 h-3.5 inline mr-1 text-primary" />
                    {t('profile_setup.phone')} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('profile_setup.phone_placeholder')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border focus:ring-2 focus:ring-primary focus:outline-none text-sm min-h-[44px]"
                  />
                  <p className="text-[11px] text-brand-muted mt-1 leading-snug">
                    {t('profile_setup.phone_hint')}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text uppercase mb-1">
                    {t('profile_setup.whatsapp')}
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder={t('profile_setup.whatsapp_placeholder')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border focus:ring-2 focus:ring-primary focus:outline-none text-sm min-h-[44px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Location */}
          <div className="pt-4 border-t border-brand-border">
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              स्थान (Location in Nepal)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-text uppercase mb-1">
                  {t('profile_setup.province')}
                </label>
                <select
                  value={selectedProvinceId}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : '';
                    setSelectedProvinceId(val);
                    setSelectedDistrictId('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border bg-white focus:ring-2 focus:ring-primary focus:outline-none text-sm min-h-[44px]"
                >
                  <option value="">-- {t('profile_setup.province')} --</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {language === 'ne' ? p.name_ne : p.name_en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text uppercase mb-1">
                  {t('profile_setup.district')} *
                </label>
                <select
                  required
                  value={selectedDistrictId}
                  onChange={(e) => setSelectedDistrictId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border bg-white focus:ring-2 focus:ring-primary focus:outline-none text-sm min-h-[44px]"
                >
                  <option value="">-- {t('profile_setup.district')} --</option>
                  {filteredDistricts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {language === 'ne' ? d.name_ne : d.name_en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-brand-text uppercase mb-1">
                  {t('profile_setup.tole')}
                </label>
                <input
                  type="text"
                  value={tole}
                  onChange={(e) => setTole(e.target.value)}
                  placeholder={t('profile_setup.tole_placeholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border focus:ring-2 focus:ring-primary focus:outline-none text-sm min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Skills & Trades (Optional for workers, can be updated later) */}
          <div className="pt-4 border-t border-brand-border">
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              सीप तथा दक्षता (Skills & Trade)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-text uppercase mb-1">
                  {t('profile_setup.headline')}
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder={t('profile_setup.headline_placeholder')}
                  maxLength={120}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border focus:ring-2 focus:ring-primary focus:outline-none text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text uppercase mb-1">
                  {t('profile_setup.skills_label')}
                </label>
                <p className="text-xs text-brand-muted mb-2">
                  {t('profile_setup.skills_hint')}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {trades.map((trade) => {
                    const isChecked = skills.includes(trade.slug);
                    return (
                      <button
                        key={trade.slug}
                        type="button"
                        onClick={() => toggleSkill(trade.slug)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition-all flex items-center justify-between touch-manipulation min-h-[44px] ${
                          isChecked
                            ? 'bg-primary-light border-primary text-primary shadow-xs'
                            : 'bg-white border-brand-border text-brand-text hover:bg-gray-50'
                        }`}
                      >
                        <span className="truncate">
                          {language === 'ne' ? trade.name_ne : trade.name_en}
                        </span>
                        {isChecked && <span className="text-primary font-bold ml-1">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="max-w-xs">
                <label className="block text-xs font-bold text-brand-text uppercase mb-1">
                  {t('profile_setup.experience')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value ? Number(e.target.value) : '')}
                  placeholder="जस्तै: 5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border focus:ring-2 focus:ring-primary focus:outline-none text-sm min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-brand-border">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 px-6 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-base shadow-md active:scale-[0.98] transition-all min-h-[50px] flex items-center justify-center gap-2"
            >
              {saving ? (
                <span>{t('profile_setup.saving')}</span>
              ) : (
                <>
                  <span>{t('profile_setup.save_btn')}</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
