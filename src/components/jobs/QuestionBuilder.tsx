'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, HelpCircle, BookOpen, CheckCircle, X } from 'lucide-react';
import type { QuestionKind } from '@/types/database.types';

export interface ScreeningQuestionInput {
  kind: QuestionKind;
  question: string;
  options: string[];
  correctIndex: number; // for MCQ
}

interface QuestionBuilderProps {
  tradeSlug: string;
  questions: ScreeningQuestionInput[];
  onChange: (questions: ScreeningQuestionInput[]) => void;
}

export default function QuestionBuilder({ tradeSlug, questions, onChange }: QuestionBuilderProps) {
  const { t, language } = useLanguage();
  const supabase = createClient();

  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    async function fetchTemplates() {
      if (!tradeSlug) {
        setTemplates([]);
        return;
      }
      setLoadingTemplates(true);
      try {
        const { data } = await supabase
          .from('question_templates')
          .select('*')
          .or(`trade_slug.eq.${tradeSlug},trade_slug.is.null`);

        if (data) {
          setTemplates(data);
        }
      } catch (err) {
        console.error('Error fetching question templates:', err);
      } finally {
        setLoadingTemplates(false);
      }
    }

    fetchTemplates();
  }, [tradeSlug, supabase]);

  const addQuestion = (kind: QuestionKind = 'mcq') => {
    if (questions.length >= 5) return;
    const newQ: ScreeningQuestionInput = {
      kind,
      question: '',
      options: kind === 'mcq' ? ['', '', ''] : [],
      correctIndex: 0,
    };
    onChange([...questions, newQ]);
  };

  const removeQuestion = (idx: number) => {
    const updated = questions.filter((_, i) => i !== idx);
    onChange(updated);
  };

  const updateQuestion = (idx: number, patch: Partial<ScreeningQuestionInput>) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], ...patch };
    onChange(updated);
  };

  const updateOption = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...questions];
    const newOpts = [...updated[qIdx].options];
    newOpts[optIdx] = val;
    updated[qIdx] = { ...updated[qIdx], options: newOpts };
    onChange(updated);
  };

  const addOption = (qIdx: number) => {
    const updated = [...questions];
    if (updated[qIdx].options.length >= 5) return;
    updated[qIdx] = {
      ...updated[qIdx],
      options: [...updated[qIdx].options, ''],
    };
    onChange(updated);
  };

  const removeOption = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    if (updated[qIdx].options.length <= 2) return; // Keep at least 2 options
    const newOpts = updated[qIdx].options.filter((_, i) => i !== optIdx);
    const newCorrect =
      updated[qIdx].correctIndex >= newOpts.length
        ? Math.max(0, newOpts.length - 1)
        : updated[qIdx].correctIndex;
    updated[qIdx] = { ...updated[qIdx], options: newOpts, correctIndex: newCorrect };
    onChange(updated);
  };

  const applyTemplate = (tmpl: any) => {
    if (questions.length >= 5) return;
    const isNe = language === 'ne';
    const qText = isNe ? tmpl.question_ne : tmpl.question_en;
    let opts: string[] = [];
    if (tmpl.kind === 'mcq') {
      const rawOpts = isNe ? tmpl.options_ne : tmpl.options_en;
      if (Array.isArray(rawOpts)) {
        opts = rawOpts;
      } else if (rawOpts && typeof rawOpts === 'object') {
        opts = Object.values(rawOpts);
      }
    }

    const newQ: ScreeningQuestionInput = {
      kind: tmpl.kind,
      question: qText || '',
      options: opts.length > 0 ? opts : ['', ''],
      correctIndex: tmpl.correct_index ?? 0,
    };

    onChange([...questions, newQ]);
    setShowTemplatesModal(false);
  };

  return (
    <div className="space-y-4 pt-3 border-t border-brand-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-brand-text flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span>{t('screening.section_title')}</span>
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            {t('screening.section_subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {templates.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTemplatesModal(true)}
              disabled={questions.length >= 5}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary-light text-primary text-xs font-bold hover:bg-primary/10 active:scale-95 transition-all disabled:opacity-50"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t('screening.use_template')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => addQuestion('mcq')}
            disabled={questions.length >= 5}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('screening.add_question')}</span>
          </button>
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-brand-border p-5 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="font-bold text-sm text-brand-text flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span>{t('screening.select_template')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowTemplatesModal(false)}
                className="p-1 rounded-lg text-brand-muted hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {templates.map((tmpl) => {
                const isNe = language === 'ne';
                const text = isNe ? tmpl.question_ne : tmpl.question_en;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => applyTemplate(tmpl)}
                    className="p-3 rounded-xl border border-brand-border hover:border-primary hover:bg-primary-light/30 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-brand-text">{text}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-brand-muted uppercase">
                        {tmpl.kind}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowTemplatesModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-brand-muted hover:bg-gray-100"
              >
                {t('screening.close_templates')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question List */}
      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <div
            key={qIdx}
            className="p-4 rounded-2xl border border-brand-border bg-[#FBFBFA] space-y-3 relative"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-primary">
                Q{qIdx + 1}
              </span>

              <div className="flex items-center gap-2">
                {/* Kind Toggle */}
                <select
                  value={q.kind}
                  onChange={(e) => {
                    const kind = e.target.value as QuestionKind;
                    updateQuestion(qIdx, {
                      kind,
                      options: kind === 'mcq' && q.options.length < 2 ? ['', '', ''] : q.options,
                    });
                  }}
                  className="text-xs font-semibold py-1 px-2 rounded-lg border border-brand-border bg-white text-brand-text"
                >
                  <option value="mcq">{t('screening.type_mcq')}</option>
                  <option value="text">{t('screening.type_text')}</option>
                </select>

                <button
                  type="button"
                  onClick={() => removeQuestion(qIdx)}
                  className="p-1 rounded-lg text-red-500 hover:bg-red-50"
                  title={t('screening.remove_question')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Question Text Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-brand-muted mb-1">
                {t('screening.question_label')}
              </label>
              <input
                type="text"
                required
                value={q.question}
                onChange={(e) => updateQuestion(qIdx, { question: e.target.value })}
                placeholder={t('screening.question_placeholder')}
                className="w-full px-3 py-2 rounded-xl border border-brand-border bg-white text-xs text-brand-text focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* MCQ Options with Correct Radio Selection */}
            {q.kind === 'mcq' && (
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-bold uppercase text-brand-muted">
                  {t('screening.options_label')}
                </label>

                <div className="space-y-1.5">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct_q_${qIdx}`}
                        checked={q.correctIndex === oIdx}
                        onChange={() => updateQuestion(qIdx, { correctIndex: oIdx })}
                        title={t('screening.correct_option')}
                        className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                      />
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                        placeholder={`${t('screening.option_placeholder')} ${oIdx + 1}${
                          q.correctIndex === oIdx ? ' (✓ Correct)' : ''
                        }`}
                        className={`flex-1 px-3 py-1.5 rounded-lg border text-xs bg-white text-brand-text focus:outline-none focus:ring-1 focus:ring-primary ${
                          q.correctIndex === oIdx
                            ? 'border-primary ring-1 ring-primary/30 font-medium'
                            : 'border-brand-border'
                        }`}
                      />
                      {q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(qIdx, oIdx)}
                          className="p-1 text-brand-muted hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {q.options.length < 5 && (
                  <button
                    type="button"
                    onClick={() => addOption(qIdx)}
                    className="text-xs font-bold text-primary hover:underline mt-1"
                  >
                    {t('screening.add_option')}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
