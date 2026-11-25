"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isAdmin: boolean;
}

interface CustomerAuthContextValue {
  user: CustomerProfile | null;
  session: Session | null;
  loading: boolean;
  authModalOpen: boolean;
  authModalMode: "login" | "signup";
  openAuthModal: (mode?: "login" | "signup") => void;
  closeAuthModal: () => void;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<{ success: boolean; error?: string; requireVerification?: boolean }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextValue | undefined>(
  undefined,
);

function mapSupabaseUser(sbUser: User | null): CustomerProfile | null {
  if (!sbUser) return null;
  const meta = sbUser.user_metadata || {};
  const name =
    meta.full_name || meta.name || sbUser.email?.split("@")[0] || "User";
  const avatar = meta.avatar_url || meta.picture || undefined;
  return {
    id: sbUser.id,
    name,
    email: sbUser.email || "",
    avatar,
    isAdmin: sbUser.app_metadata?.role === "admin",
  };
}

export function CustomerAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;
    let receivedEvent = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted || receivedEvent) return;
        setSession(data.session ?? null);
        setUser(mapSupabaseUser(data.session?.user ?? null));
      })
      .catch(() => {
        if (!mounted || receivedEvent) return;
        setSession(null);
        setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, nextSession) => {
      if (!mounted) return;
      receivedEvent = true;
      setSession(nextSession);
      setUser(mapSupabaseUser(nextSession?.user ?? null));
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const openAuthModal = useCallback((mode: "login" | "signup" = "login") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) return { success: false, error: error.message };
        setSession(data.session);
        setUser(mapSupabaseUser(data.user));
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Login failed",
        };
      }
    },
    [supabase],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, name?: string) => {
      try {
        const cleanEmail = email.trim();
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: name?.trim() || cleanEmail.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        });
        if (error) return { success: false, error: error.message };
        if (data.session) {
          setSession(data.session);
          setUser(mapSupabaseUser(data.user));
          return { success: true };
        }
        return { success: true, requireVerification: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Sign up failed",
        };
      }
    },
    [supabase],
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      const nextPath =
        window.location.pathname === "/login" ? "/" : window.location.pathname;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`,
          queryParams: {
            prompt: "consent select_account",
          },
        },
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Google Sign-In failed",
      };
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }, [supabase]);

  return (
    <CustomerAuthContext.Provider
      value={{
        user,
        session,
        loading,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) {
    throw new Error("useCustomerAuth must be used inside CustomerAuthProvider");
  }
  return ctx;
}
