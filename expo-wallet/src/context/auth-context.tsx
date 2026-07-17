import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  authError: string | null;
  authLoading: boolean;
  initializing: boolean;
  session: Session | null;
  user: User | null;
  configured: boolean;
  clearAuthError: () => void;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) {
      setInitializing(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          setAuthError(error.message);
        }
        setSession(data.session);
      })
      .finally(() => setInitializing(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setInitializing(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      setAuthError("Supabase is not configured for this build.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signUpWithPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      setAuthError("Supabase is not configured for this build.");
      return false;
    }

    setAuthLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return Boolean(data.session);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to create an account.");
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;

    setAuthLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign out.");
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authError,
      authLoading,
      initializing,
      session,
      user: session?.user ?? null,
      configured: Boolean(supabase),
      clearAuthError,
      signInWithPassword,
      signUpWithPassword,
      signOut,
    }),
    [authError, authLoading, clearAuthError, initializing, session, signInWithPassword, signOut, signUpWithPassword],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
