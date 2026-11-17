'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileContact = Database['public']['Tables']['profile_contacts']['Row'];
type WorkerDetails = Database['public']['Tables']['worker_details']['Row'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  contact: ProfileContact | null;
  workerDetails: WorkerDetails | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contact, setContact] = useState<ProfileContact | null>(null);
  const [workerDetails, setWorkerDetails] = useState<WorkerDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchUserData = async (userId: string) => {
    try {
      const [profileRes, contactRes, workerRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('profile_contacts').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('worker_details').select('*').eq('user_id', userId).maybeSingle(),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (contactRes.data) setContact(contactRes.data);
      if (workerRes.data) setWorkerDetails(workerRes.data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserData(session.user.id);
        }
      } catch (e) {
        console.error('Error initializing auth:', e);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          await fetchUserData(currentSession.user.id);
        } else {
          setProfile(null);
          setContact(null);
          setWorkerDetails(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setContact(null);
    setWorkerDetails(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        contact,
        workerDetails,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
