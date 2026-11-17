'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Star, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ReviewModalProps {
  hireId: string;
  revieweeId: string;
  revieweeName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReviewModal({
  hireId,
  revieweeId,
  revieweeName,
  isOpen,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const supabase = createClient();

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user) {
      setErrorMsg('Please log in first.');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('reviews').insert({
        hire_id: hireId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating: rating,
        comment: comment.trim() || null,
      });

      if (error) {
        if (error.message?.includes('unique') || error.code === '23505') {
          throw new Error(t('reviews.already_reviewed'));
        }
        throw error;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Review submit error:', err);
      setErrorMsg(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-brand-border p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-brand-border pb-3">
          <div>
            <h2 className="text-base font-bold text-brand-text">
              {t('reviews.title')}
            </h2>
            <p className="text-xs text-brand-muted mt-0.5">
              {revieweeName}
            </p>
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
              {t('reviews.success')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Star Rating Input */}
            <div>
              <label className="block text-xs font-bold uppercase text-brand-muted mb-2 text-center">
                {t('reviews.rating_label')}
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 active:scale-95 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-gray-300 fill-gray-100'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-bold uppercase text-brand-muted mb-1">
                {t('reviews.comment_label')}
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('reviews.comment_placeholder')}
                className="w-full px-3 py-2 rounded-xl border border-brand-border text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              ></textarea>
              <div className="text-right text-[10px] text-brand-muted">
                {comment.length} / 500
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover active:scale-95 transition-all shadow-sm disabled:opacity-50 min-h-[44px]"
            >
              {submitting ? t('reviews.submitting') : t('reviews.submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
