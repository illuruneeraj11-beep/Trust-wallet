import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  supabase,
  supabaseConfigurationError,
  walletRuntimeMode,
} from "@/lib/supabase";

type AuthContextValue = {
  authError: string | null;
  authLoading: boolean;
  initializing: boolean;
  session: Session | null;
  user: User | null;
  configured: boolean;
  visualDemo: boolean;
  clearAuthError: () => void;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<SignUpOutcome>;
  signOut: () => Promise<void>;
};

export type SignUpOutcome = "signed-in" | "confirmation-required" | "error";

const AuthContext = createContext<AuthContextValue | null>(null);

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const visualDemo = walletRuntimeMode === "visual-demo";
  const [authError, setAuthError] = useState<string | null>(supabaseConfigurationError);
  const [authLoading, setAuthLoading] = useState(false);
  const [initializing, setInitializing] = useState(!visualDemo && isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (visualDemo || !supabase) {
      setSession(null);
      setInitializing(false);
      return undefined;
    }

    let active = true;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setAuthError(error.message);
        setSession(data.session);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setAuthError(messageFrom(error, "Unable to restore the previous session."));
        setSession(null);
      })
      .finally(() => {
        if (active) setInitializing(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setInitializing(false);
      if (nextSession) setAuthError(null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [visualDemo]);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      setAuthError(supabaseConfigurationError ?? "Supabase is not configured for this build.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    } catch (error) {
      setAuthError(messageFrom(error, "Unable to sign in."));
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signUpWithPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      setAuthError(supabaseConfigurationError ?? "Supabase is not configured for this build.");
      return "error" as const;
    }

    setAuthLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) throw error;
      return data.session ? "signed-in" as const : "confirmation-required" as const;
    } catch (error) {
      setAuthError(messageFrom(error, "Unable to create an account."));
      return "error" as const;
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
      setAuthError(messageFrom(error, "Unable to sign out."));
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
      configured: isSupabaseConfigured,
      visualDemo,
      clearAuthError,
      signInWithPassword,
      signUpWithPassword,
      signOut,
    }),
    [authError, authLoading, clearAuthError, initializing, session, signInWithPassword, signOut, signUpWithPassword, visualDemo],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
