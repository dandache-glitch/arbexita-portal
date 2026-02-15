"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/client";

export type AuthState = {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  accessToken: string | null;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    session: null,
    user: null,
    accessToken: null
  });

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        setState({ isLoading: false, session: null, user: null, accessToken: null });
        return;
      }

      const session = data.session ?? null;
      setState({
        isLoading: false,
        session,
        user: session?.user ?? null,
        accessToken: session?.access_token ?? null
      });
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState({
        isLoading: false,
        session: session ?? null,
        user: session?.user ?? null,
        accessToken: session?.access_token ?? null
      });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
