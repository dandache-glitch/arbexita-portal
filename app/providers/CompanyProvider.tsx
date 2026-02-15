"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/app/providers/AuthProvider";

export type CompanyContextValue = {
  isLoading: boolean;
  companyId: string | null;
  companyName: string;
  industry: string;
  annualReviewDone: boolean;
  refresh: () => Promise<void>;
};

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const { user, isLoading: authLoading } = useAuth();

  const [state, setState] = useState<Omit<CompanyContextValue, "refresh">>({
    isLoading: true,
    companyId: null,
    companyName: "Företaget",
    industry: "kontor",
    annualReviewDone: false
  });

  const refresh = async () => {
    if (!user) {
      setState((s) => ({ ...s, isLoading: false, companyId: null }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true }));

    const { data, error } = await supabase
      .from("companies")
      .select("id, name, industry, annual_review_done")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (error) {
      setState({
        isLoading: false,
        companyId: null,
        companyName: "Företaget",
        industry: "kontor",
        annualReviewDone: false
      });
      return;
    }

    setState({
      isLoading: false,
      companyId: (data?.id as string) ?? null,
      companyName: (data?.name as string) || "Företaget",
      industry: (data?.industry as string) || "kontor",
      annualReviewDone: Boolean((data as any)?.annual_review_done)
    });
  };

  useEffect(() => {
    if (authLoading) return;
    // When user changes, refresh company context.
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  const value: CompanyContextValue = {
    ...state,
    isLoading: authLoading || state.isLoading,
    refresh
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}
