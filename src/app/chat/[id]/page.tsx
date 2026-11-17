'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatNepaliPhoneForDisplay, getCallLink, getWhatsAppLink } from '@/lib/utils/phone';
import {
  ArrowLeft,
  Send,
  Phone,
  MessageSquare,
  Briefcase,
  AlertCircle,
  Check,
  CheckCheck,
  User as UserIcon,
} from 'lucide-react';
import type { Database } from '@/types/database.types';

type Message = Database['public']['Tables']['messages']['Row'];

export default function ChatRoomPage() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [conversation, setConversation] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [contact, setContact] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputBody, setInputBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation and messages
  useEffect(() => {
    async function initChat() {
      if (!id || !user) return;
      setLoading(true);

      try {
        // 1. Fetch conversation
        const { data: conv, error: convErr } = await supabase
          .from('conversations')
          .select(`
            id,
            user_a,
            user_b,
            job_id,
            jobs (
              id,
              title,
              trade_slug
            )
          `)
          .eq('id', id)
          .maybeSingle();

        if (convErr) throw convErr;
        if (!conv) {
          setErrorMsg('Conversation not found');
          return;
        }

        // Verify participation
        if (conv.user_a !== user.id && conv.user_b !== user.id) {
          setErrorMsg('Access denied');
          return;
        }

        setConversation(conv);

        const otherId = conv.user_a === user.id ? conv.user_b : conv.user_a;

        // 2. Fetch other user profile & contact
        const [profileRes, contactRes] = await Promise.all([
          supabase.from('profiles').select('id, full_name, avatar_url, rating_avg').eq('id', otherId).maybeSingle(),
          supabase.from('profile_contacts').select('phone, whatsapp').eq('user_id', otherId).maybeSingle(),
        ]);

        if (profileRes.data) setOtherUser(profileRes.data);
        if (contactRes.data) setContact(contactRes.data);

        // 3. Mark messages as read
        await supabase.rpc('mark_read', { conv: id });

        // 4. Fetch initial messages
        const { data: msgs, error: msgsErr } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', id)
          .order('created_at', { ascending: true });

        if (msgsErr) throw msgsErr;
        if (msgs) setMessages(msgs);
      } catch (err: any) {
        console.error('Error initializing chat:', err);
        setErrorMsg(err.message || 'Failed to load conversation');
      } finally {
        setLoading(false);
      }
    }

    initChat();
  }, [id, user, supabase]);

  // Realtime subscription
  useEffect(() => {
    if (!id || !user) return;

    const channel = supabase
      .channel(`chat_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicate if already in state
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          if (newMsg.sender_id !== user.id) {
            supabase.rpc('mark_read', { conv: id });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputBody.trim() || sending || !user) return;

    const bodyText = inputBody.trim();
    setInputBody('');
    setSending(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: id,
          sender_id: user.id,
          body: bodyText,
        })
        .select('*')
        .single();

      if (error) {
        if (error.message?.includes('rate_limit') || error.message?.includes('Too many requests')) {
          throw new Error(t('chat.rate_limited'));
        }
        throw error;
      }

      if (data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    } catch (err: any) {
      console.error('Send message error:', err);
      setErrorMsg(err.message || 'Failed to send message');
      setInputBody(bodyText); // restore input
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center text-brand-muted">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs">{t('common.loading')}</p>
      </div>
    );
  }

  if (errorMsg && !conversation) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="bg-white rounded-2xl border border-brand-border p-8 shadow-sm space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h1 className="text-base font-bold text-brand-text">{errorMsg}</h1>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('chat.title')}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-150px)]">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-brand-border p-3.5 shadow-xs flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/chat"
            className="p-1.5 rounded-lg text-brand-muted hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="w-10 h-10 rounded-full bg-primary-light text-primary font-bold text-sm flex items-center justify-center border border-primary/20 flex-shrink-0">
            {otherUser?.full_name ? otherUser.full_name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="min-w-0">
            <Link
              href={`/workers/${otherUser?.id}`}
              className="font-bold text-sm text-brand-text truncate block hover:text-primary transition-colors"
            >
              {otherUser?.full_name || 'KaamXa User'}
            </Link>
            <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
              {t('chat.online')}
            </span>
          </div>
        </div>

        {/* Action icons: Call & WhatsApp if phone revealed */}
        <div className="flex items-center gap-1.5">
          {contact?.phone && (
            <a
              href={getCallLink(contact.phone)}
              className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover active:scale-95 transition-all shadow-2xs"
              title={`${t('common.call')}: ${contact.phone}`}
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
          {contact?.whatsapp && (
            <a
              href={getWhatsAppLink(contact.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-[#25D366] text-white hover:opacity-90 active:scale-95 transition-all shadow-2xs"
              title={t('common.whatsapp')}
            >
              <MessageSquare className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Linked Job Context Banner */}
      {conversation?.jobs && (
        <div className="bg-primary-light/40 border border-primary/20 rounded-xl px-3 py-2 text-xs flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 truncate">
            <Briefcase className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="font-bold text-brand-text truncate">
              {conversation.jobs.title}
            </span>
          </div>
          <Link
            href={`/jobs/${conversation.jobs.id}`}
            className="text-[11px] font-bold text-primary hover:underline flex-shrink-0"
          >
            {t('common.view')} →
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-white rounded-2xl border border-brand-border space-y-3 shadow-xs">
        {messages.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-xs text-brand-muted">
              {language === 'ne'
                ? 'कुराकानी सुरु गर्न सन्देश लेखेर पठाउनुहोस्।'
                : 'Say Namaste and start the conversation.'}
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === user?.id;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                    isMe
                      ? 'bg-primary text-white rounded-br-xs'
                      : 'bg-brand-bg text-brand-text border border-brand-border rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <div
                    className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                      isMe ? 'text-white/70' : 'text-brand-muted'
                    }`}
                  >
                    <span>{formatMessageTime(m.created_at)}</span>
                    {isMe && (
                      m.read_at ? (
                        <CheckCheck className="w-3.5 h-3.5 text-accent-light" />
                      ) : (
                        <Check className="w-3 h-3 text-white/60" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={inputBody}
          onChange={(e) => setInputBody(e.target.value)}
          placeholder={t('chat.type_placeholder')}
          maxLength={2000}
          className="flex-1 px-4 py-3 rounded-2xl border border-brand-border bg-white text-xs sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-primary shadow-xs min-h-[48px]"
        />
        <button
          type="submit"
          disabled={!inputBody.trim() || sending}
          className="p-3.5 rounded-2xl bg-accent text-white hover:bg-accent-hover active:scale-95 transition-all shadow-md disabled:opacity-40 min-h-[48px] flex items-center justify-center flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
