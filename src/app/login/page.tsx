'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  X,
  Shield,
  HelpCircle,
} from 'lucide-react';

function LoginForm() {
  const { t, language } = useLanguage();
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('next') || '/';

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showGoogleGuide, setShowGoogleGuide] = useState(false);
  const [copiedCallback, setCopiedCallback] = useState(false);

  const supabase = createClient();
  const callbackUrl = 'https://rmuidbzztlcidisggclr.supabase.co/auth/v1/callback';

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      router.push(redirectUrl);
    }
  }, [user, router, redirectUrl]);

  // Check URL errors (both searchParams and hash fragments)
  useEffect(() => {
    const error = searchParams.get('error');
    const errorDesc = searchParams.get('error_description');

    if (errorDesc) {
      const decoded = decodeURIComponent(errorDesc).replace(/\+/g, ' ');
      if (decoded.includes('provider is not enabled') || decoded.includes('Unsupported provider')) {
        setShowGoogleGuide(true);
      } else {
        setErrorMsg(decoded);
      }
    } else if (error === 'auth_callback_failed') {
      setErrorMsg(
        language === 'ne'
          ? 'लगइन प्रमाणीकरण पूरा हुन सकेन। कृपया पुनः प्रयास गर्नुहोस् वा इमेल प्रयोग गर्नुहोस्।'
          : 'Authentication callback failed. Please try again or use Email & Password.'
      );
    }

    // Check hash for OAuth errors (Supabase passes errors in hash fragment on redirect)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const hashError = params.get('error_description') || params.get('error');
      if (hashError) {
        const decoded = decodeURIComponent(hashError).replace(/\+/g, ' ');
        if (decoded.includes('provider is not enabled') || decoded.includes('Unsupported provider')) {
          setShowGoogleGuide(true);
        } else {
          setErrorMsg(decoded);
        }
      }
    }
  }, [searchParams, language]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      // Use the actual current browser origin (localhost or production domain)
      const siteUrl = window.location.origin;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      if (
        err?.message?.includes('provider is not enabled') ||
        err?.message?.includes('Unsupported provider')
      ) {
        setShowGoogleGuide(true);
      } else {
        setErrorMsg(t('auth.auth_error') + (err.message || 'Failed to sign in with Google'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCallback = async () => {
    await navigator.clipboard.writeText(callbackUrl);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2500);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!fullName.trim()) {
          throw new Error(language === 'ne' ? 'कृपया पूरा नाम भर्नुहोस्।' : 'Please enter your full name.');
        }
        if (password.length < 6) {
          throw new Error(language === 'ne' ? 'पासवर्ड कम्तीमा ६ अक्षरको हुनुपर्छ।' : 'Password must be at least 6 characters.');
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          await refreshProfile();
          router.push('/profile/setup');
        } else if (data.user) {
          setSuccessMsg(
            language === 'ne'
              ? 'खाता सिर्जना भयो! कृपया आफ्नो इमेल इनबक्स चेक गर्नुहोस् वा लगइन गर्नुहोस्।'
              : 'Account created! Please check your email to confirm, or proceed to log in.'
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            throw new Error(
              language === 'ne'
                ? 'इमेल वा पासवर्ड मिलेन। यदि खाता छैन भने माथि "नयाँ दर्ता" ट्याब थिचेर खाता बनाउनुहोस्।'
                : 'Invalid login credentials. If you do not have an account yet, click the "Sign Up" tab above to create one.'
            );
          }
          throw error;
        }

        await refreshProfile();
        router.push(redirectUrl);
      }
    } catch (err: any) {
      setErrorMsg(t('auth.auth_error') + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 sm:py-12">
      <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-6 sm:p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-1 mb-2">
            <span className="text-3xl font-black tracking-tight text-primary">
              Kaam<span className="text-accent">X</span>a
            </span>
            <span className="text-xs font-bold bg-primary-light text-primary px-2 py-0.5 rounded-full ml-1">
              काम छ
            </span>
          </div>
          <h1 className="text-xl font-bold text-brand-text">
            {t('auth.login_title')}
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            {t('auth.login_subtitle')}
          </p>
        </div>

        {/* Tab switch between Login and Sign Up */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white text-primary shadow-xs'
                : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            <LogIn className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            {t('auth.login_tab')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-white text-primary shadow-xs'
                : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            <UserPlus className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            {t('auth.signup_tab')}
          </button>
        </div>

        {/* Alert Messages */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{errorMsg}</span>
              {mode === 'login' && errorMsg.includes('Sign Up') && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg('');
                  }}
                  className="block mt-2 font-bold underline text-primary hover:text-primary-hover"
                >
                  {t('auth.no_account')} →
                </button>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-brand-border bg-white hover:bg-gray-50 active:scale-[0.98] font-semibold text-sm text-brand-text transition-all shadow-xs min-h-[48px]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{loading ? t('auth.logging_in') : t('auth.btn_google')}</span>
        </button>

        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-brand-border"></div>
          </div>
          <span className="relative bg-white px-3 text-xs uppercase text-brand-muted font-bold">
            {t('auth.or_divider')}
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-brand-text uppercase mb-1">
                {t('auth.full_name_label')}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('auth.full_name_placeholder')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white min-h-[44px]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-brand-text uppercase mb-1">
              {t('auth.email_label')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.email_placeholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text uppercase mb-1">
              {t('auth.password_label')}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.password_placeholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white min-h-[44px]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover active:scale-[0.98] transition-all shadow-xs min-h-[48px] flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span>{t('auth.logging_in')}</span>
            ) : mode === 'login' ? (
              <span>{t('auth.btn_login')}</span>
            ) : (
              <span>{t('auth.btn_signup')}</span>
            )}
          </button>
        </form>

        {/* Quick toggle at bottom */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {mode === 'login' ? t('auth.no_account') : t('auth.have_account')}
          </button>
        </div>

        {/* Safety Note */}
        <div className="mt-6 pt-4 border-t border-brand-border text-center">
          <p className="text-[11px] text-brand-muted">
            {t('common.safety_warning')}
          </p>
        </div>
      </div>

      {/* Google Setup Guidance Modal (Shown when Google OAuth is not yet toggled ON in Supabase) */}
      {showGoogleGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-brand-border p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  G
                </div>
                <div>
                  <h3 className="font-bold text-base text-brand-text">
                    {language === 'ne' ? 'Google लगइन सक्रिय गर्नुहोस्' : 'Enable Google Sign-In'}
                  </h3>
                  <p className="text-xs text-brand-muted">
                    {language === 'ne' ? 'Supabase Dashboard मा २ मिनेटमा सेटअप गर्नुहोस्' : '2-minute setup in Supabase Dashboard'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleGuide(false)}
                className="p-1 rounded-xl text-brand-muted hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-brand-text space-y-3 leading-relaxed">
              <p className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl font-medium">
                {language === 'ne'
                  ? 'Supabase ले Google लगइन सुरु गर्न Google Client ID र Secret माग्दछ। तलका ३ सजिला चरणहरू पूरा गर्नुहोस्:'
                  : 'Supabase requires a Google Cloud Client ID & Secret to allow Google Sign-In. Follow these 3 quick steps:'}
              </p>

              <ol className="space-y-3 list-decimal list-inside pl-1 text-xs">
                <li className="font-semibold text-brand-text">
                  <span>
                    {language === 'ne'
                      ? 'Google Cloud Console मा जानुहोस् र OAuth Client ID (Web Application) बनाउनुहोस्:'
                      : 'Go to Google Cloud Console and create an OAuth Client ID (Web Application):'}
                  </span>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary underline font-bold ml-1"
                  >
                    Google Cloud Credentials <ExternalLink className="w-3 h-3" />
                  </a>
                  <div className="mt-1.5 p-2.5 rounded-xl bg-gray-50 border border-brand-border text-[11px] font-mono">
                    <span className="block text-brand-muted font-sans font-medium mb-1">
                      {language === 'ne' ? 'Authorized redirect URI मा यो हाल्नुहोस्:' : 'Add this as Authorized redirect URI:'}
                    </span>
                    <div className="flex items-center justify-between gap-2 bg-white p-1.5 rounded-lg border border-brand-border">
                      <span className="truncate">{callbackUrl}</span>
                      <button
                        type="button"
                        onClick={handleCopyCallback}
                        className="px-2 py-1 rounded bg-primary text-white text-[10px] font-sans font-bold flex items-center gap-1 flex-shrink-0"
                      >
                        {copiedCallback ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCallback ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </li>

                <li className="font-semibold text-brand-text">
                  <span>
                    {language === 'ne'
                      ? 'Supabase Dashboard को Google Provider खोल्नुहोस्:'
                      : 'Open Supabase Dashboard Google Provider settings:'}
                  </span>
                  <a
                    href="https://supabase.com/dashboard/project/rmuidbzztlcidisggclr/auth/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary underline font-bold ml-1"
                  >
                    Supabase Providers <ExternalLink className="w-3 h-3" />
                  </a>
                </li>

                <li className="font-semibold text-brand-text">
                  <span>
                    {language === 'ne'
                      ? 'Google Provider लाई ON गर्नुहोस् र Google बाट पाएको Client ID र Client Secret पेस्ट गरेर Save थिच्नुहोस्।'
                      : 'Toggle Google to ON, paste the Client ID and Client Secret from Google, and click Save.'}
                  </span>
                </li>
              </ol>
            </div>

            <div className="pt-2 border-t border-brand-border flex items-center justify-between">
              <span className="text-[11px] text-brand-muted">
                {language === 'ne' ? 'अहिले नै तुरुन्तै इमेलबाट लगइन गर्न सकिन्छ।' : 'Or use Email & Password below right away.'}
              </span>
              <button
                type="button"
                onClick={() => setShowGoogleGuide(false)}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover active:scale-95 transition-all shadow-xs"
              >
                {language === 'ne' ? 'बुझें, बन्द गर्नुहोस्' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-12 text-center text-brand-muted">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs">Loading...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
