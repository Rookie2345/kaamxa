'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/utils/date';
import { MessageSquare, LogIn, ChevronRight, Briefcase } from 'lucide-react';

export default function ChatListPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const supabase = createClient();

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConversations() {
      if (!user) return;
      setLoading(true);

      try {
        // Fetch conversations where user is participant
        const { data: convData, error } = await supabase
          .from('conversations')
          .select(`
            id,
            user_a,
            user_b,
            job_id,
            created_at,
            jobs (
              id,
              title
            )
          `)
          .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (convData && convData.length > 0) {
          // Identify other user ids
          const otherUserIds = convData.map((c: any) =>
            c.user_a === user.id ? c.user_b : c.user_a
          );

          // Fetch profiles of other participants
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, rating_avg')
            .in('id', otherUserIds);

          const profileMap: Record<string, any> = {};
          if (profilesData) {
            profilesData.forEach((p: any) => {
              profileMap[p.id] = p;
            });
          }

          // Fetch latest message & unread counts for each conversation
          const enriched = await Promise.all(
            convData.map(async (c: any) => {
              const otherId = c.user_a === user.id ? c.user_b : c.user_a;

              // Last message
              const { data: lastMsg } = await supabase
                .from('messages')
                .select('body, created_at, sender_id, read_at')
                .eq('conversation_id', c.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              // Unread count
              const { count: unreadCount } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', c.id)
                .neq('sender_id', user.id)
                .is('read_at', null);

              return {
                ...c,
                otherUser: profileMap[otherId] || { id: otherId, full_name: 'KaamXa User' },
                lastMessage: lastMsg || null,
                unreadCount: unreadCount || 0,
              };
            })
          );

          // Sort by latest message date or conversation created_at
          enriched.sort((a, b) => {
            const timeA = new Date(a.lastMessage?.created_at || a.created_at).getTime();
            const timeB = new Date(b.lastMessage?.created_at || b.created_at).getTime();
            return timeB - timeA;
          });

          setConversations(enriched);
        } else {
          setConversations([]);
        }
      } catch (err) {
        console.error('Error loading conversations:', err);
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, [user, supabase]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="bg-white rounded-2xl border border-brand-border p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-primary-light text-primary mx-auto flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-brand-text mb-2">
            {t('nav.messages')}
          </h1>
          <p className="text-sm text-brand-muted mb-6">
            {t('auth.login_required_desc')}
          </p>
          <Link
            href="/login?next=/chat"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-accent text-white font-bold text-sm shadow-sm hover:bg-accent-hover active:scale-95 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>{t('nav.login')}</span>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-brand-muted">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-text">
          {t('chat.title')}
        </h1>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-border p-8 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-brand-bg text-brand-muted mx-auto flex items-center justify-center">
            <MessageSquare className="w-7 h-7 text-primary/60" />
          </div>
          <h2 className="text-base font-bold text-brand-text">
            {t('chat.empty_title')}
          </h2>
          <p className="text-xs sm:text-sm text-brand-muted max-w-sm mx-auto">
            {t('chat.empty_desc')}
          </p>
          <div className="pt-2">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary-hover active:scale-95 transition-all"
            >
              <span>{t('jobs.all_jobs')}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-brand-border divide-y divide-brand-border shadow-xs overflow-hidden">
          {conversations.map((c) => {
            const other = c.otherUser;
            const lastMsg = c.lastMessage;
            const hasUnread = c.unreadCount > 0;

            return (
              <Link
                key={c.id}
                href={`/chat/${c.id}`}
                className={`flex items-center gap-3.5 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                  hasUnread ? 'bg-primary-light/20' : ''
                }`}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-primary-light text-primary font-bold text-base flex items-center justify-center border border-primary/20 flex-shrink-0 relative">
                  {other.full_name ? other.full_name.charAt(0).toUpperCase() : 'U'}
                  {hasUnread && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                      {c.unreadCount}
                    </span>
                  )}
                </div>

                {/* Conversation Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={`text-sm truncate ${hasUnread ? 'font-black text-brand-text' : 'font-bold text-brand-text'}`}>
                      {other.full_name}
                    </h3>
                    {lastMsg && (
                      <span className="text-[11px] text-brand-muted flex-shrink-0">
                        {formatRelativeTime(lastMsg.created_at)}
                      </span>
                    )}
                  </div>

                  {c.jobs?.title && (
                    <div className="flex items-center gap-1 text-[11px] text-primary font-semibold truncate mb-1">
                      <Briefcase className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{c.jobs.title}</span>
                    </div>
                  )}

                  <p className={`text-xs truncate ${hasUnread ? 'font-bold text-brand-text' : 'text-brand-muted'}`}>
                    {lastMsg ? (
                      lastMsg.sender_id === user.id ? (
                        <span>You: {lastMsg.body}</span>
                      ) : (
                        <span>{lastMsg.body}</span>
                      )
                    ) : (
                      <span className="italic">{language === 'ne' ? 'कुराकानी सुरु गर्नुहोस्' : 'Start conversation'}</span>
                    )}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-brand-muted flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
