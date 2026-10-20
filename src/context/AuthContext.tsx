'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithMicrosoft: () => Promise<{ error: AuthError | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    metadata?: { full_name?: string; company?: string }
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  syncUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const syncUserWithDB = async (currentUser: User, token?: string) => {
    try {
      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || '',
          company: currentUser.user_metadata?.company || '',
        }),
      });
    } catch (e) {
      console.error('Failed to sync user with database:', e);
    }
  };

  useEffect(() => {
    // 1. Initial session load
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error fetching Supabase session:', error.message);
        }
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          syncUserWithDB(initialSession.user, initialSession.access_token);
        }
      } catch (err) {
        console.error('Unexpected error loading auth session:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Real-time auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);

      if (currentSession?.user) {
        syncUserWithDB(currentSession.user, currentSession.access_token);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`;
    }
    return 'http://localhost:3000/auth/callback';
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signInWithMicrosoft = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: getRedirectUrl(),
          scopes: 'openid email profile offline_access',
        },
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error && data.user) {
        setUser(data.user);
        setSession(data.session);
        syncUserWithDB(data.user, data.session?.access_token);
      }
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    metadata?: { full_name?: string; company?: string }
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {},
          emailRedirectTo: getRedirectUrl(),
        },
      });
      if (!error && data.user) {
        setUser(data.user);
        setSession(data.session);
        syncUserWithDB(data.user, data.session?.access_token);
      }
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cyted_user');
      }
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const syncUser = async () => {
    if (user) {
      await syncUserWithDB(user, session?.access_token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithGoogle,
        signInWithMicrosoft,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        syncUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
