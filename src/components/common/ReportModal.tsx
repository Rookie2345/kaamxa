'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Flag, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ReportReason } from '@/types/database.types';

interface ReportModalProps {
  targetType: 'job' | 'profile';
  targetId: string;
  targetTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({
  targetType,
  targetId,
  targetTitle,
  isOpen,
  onClose,
}: ReportModalProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const supabase = createClient();

  const [reason, setReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user) {
      setErrorMsg(t('auth.login_required_desc'));
      return;
    }

    setSubmitting(true);

    try {
      const payload: any = {
        reporter_id: user.id,
        reason: reason,
        details: details.trim() || null,
        job_id: targetType === 'job' ? targetId : null,
        profile_id: targetType === 'profile' ? targetId : null,
      };

      const { error } = await supabase.from('reports').insert(payload);

      if (error) {
        if (error.message?.includes('own job') || error.message?.includes('yourself')) {
          throw new Error(
            language === 'ne'
              ? 'तपाईं आफ्नै पोस्ट वा प्रोफाइल उजुरी गर्न सक्नुहुन्न।'
              : 'You cannot report your own job or profile.'
          );
        }
        if (error.message?.includes('rate_limit') || error.message?.includes('Too many requests')) {
          throw new Error('You have reached the daily report limit.');
        }
        if (error.code === '23505') {
          throw new Error(
            language === 'ne'
              ? 'तपाईंले पहिले नै यसमा उजुरी दिइसक्नुभएको छ।'
              : 'You have already reported this item.'
          );
        }
        throw error;
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Report error:', err);
      setErrorMsg(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-brand-border p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-brand-border pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-text">
                {t('reports.title')}
              </h2>
              {targetTitle && (
                <p className="text-xs text-brand-muted truncate max-w-[220px]">
                  {targetTitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-brand-muted hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {success ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <p className="text-sm font-bold text-brand-text">
              {t('reports.success')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-brand-muted">
              {t('reports.subtitle')}
            </p>

            {/* Reason Select */}
            <div>
              <label className="block text-xs font-bold uppercase text-brand-muted mb-1.5">
                {t('reports.reason_label')}
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-white text-xs font-medium text-brand-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="spam">{t('reports.reason_spam')}</option>
                <option value="fake">{t('reports.reason_fake')}</option>
                <option value="foreign_job">{t('reports.reason_foreign_job')}</option>
                <option value="asks_money">{t('reports.reason_asks_money')}</option>
                <option value="abuse">{t('reports.reason_abuse')}</option>
                <option value="other">{t('reports.reason_other')}</option>
              </select>
            </div>

            {/* Details Textarea */}
            <div>
              <label className="block text-xs font-bold uppercase text-brand-muted mb-1.5">
                {t('reports.details_label')}
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t('reports.details_placeholder')}
                className="w-full px-3 py-2 rounded-xl border border-brand-border text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              ></textarea>
              <div className="text-right text-[10px] text-brand-muted">
                {details.length} / 500
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 active:scale-95 transition-all shadow-sm disabled:opacity-50 min-h-[44px]"
            >
              {submitting ? t('reports.submitting') : t('reports.submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
