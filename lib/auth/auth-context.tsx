'use client';

import React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import type { AuthContextType } from './auth-types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      try {
        setSession(session);
        setUser(session?.user ?? null);
        setUsername(session?.user?.user_metadata?.username ?? null);
        setIsLoading(false);

        // Only show session-expired message for unexpected sign-out, not intentional logout
        if (event === 'SIGNED_OUT' && !session) {
          // Check if this is an intentional logout by looking for a flag in sessionStorage
          const intentionalLogout = sessionStorage.getItem('intentional_logout');
          if (intentionalLogout) {
            sessionStorage.removeItem('intentional_logout');
            window.location.href = '/auth/signin';
          } else {
            // Session was lost unexpectedly
            window.location.href = '/auth/signin?message=' + encodeURIComponent('Session expired, please sign in again.');
          }
        }
      } catch (error) {
        // Remove: console.error('Error in onAuthStateChange:', error);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // Only depend on router, supabase is stable
  }, [router, supabase.auth]);

  const signUp = async (email: string, password: string, username?: string, recoveryEmail?: string) => {
    try {
      const metadata: Record<string, string> = {};
      if (username) metadata.username = username;
      if (recoveryEmail) metadata.recovery_email = recoveryEmail.trim().toLowerCase();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: Object.keys(metadata).length > 0 ? { data: metadata } : undefined,
      });
      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      // Mark this as an intentional logout
      sessionStorage.setItem('intentional_logout', 'true');
      await supabase.auth.signOut();
    } catch (error) {
      // Remove: console.error('Error during sign out:', error);
    }
    // Router push happens in the onAuthStateChange listener
  };

  const value = {
    user,
    session,
    isLoading,
    username,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
