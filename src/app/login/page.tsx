'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { LogIn, UserPlus, AlertCircle, CheckCircle2, Info } from 'lucide-react';

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

  const supabase = createClient();

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      router.push(redirectUrl);
    }
  }, [user, router, redirectUrl]);

  // Check URL errors (e.g. from callback or hash)
  useEffect(() => {
    const error = searchParams.get('error');
    const errorDesc = searchParams.get('error_description');
    if (errorDesc) {
      setErrorMsg(decodeURIComponent(errorDesc));
    } else if (error === 'auth_callback_failed') {
      setErrorMsg(
        language === 'ne'
          ? 'लगइन प्रमाणीकरण असफल भयो। कृपया इमेल र पासवर्ड प्रयोग गर्नुहोस्।'
          : 'Authentication callback failed. Please try signing in with Email & Password.'
      );
    }
  }, [searchParams, language]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
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
      const isUnconfigured =
        err?.message?.includes('provider is not enabled') ||
        err?.message?.includes('Unsupported provider') ||
        err?.status === 400;

      if (isUnconfigured) {
        setErrorMsg(
          language === 'ne'
            ? 'Google लगइन Supabase मा सक्रिय गरिएको छैन। कृपया तलको "नयाँ दर्ता" ट्याबमा गएर इमेल र पासवर्डबाट खाता बनाउनुहोस् वा लगइन गर्नुहोस्।'
            : 'Google Sign-In is not enabled in your Supabase Auth settings. Please register or log in using Email & Password below.'
        );
      } else {
        setErrorMsg(t('auth.auth_error') + (err.message || 'Failed to sign in with Google'));
      }
    } finally {
      setLoading(false);
    }
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

        <p className="text-[11px] text-brand-muted text-center mt-2">
          {t('auth.google_hint')}
        </p>

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
