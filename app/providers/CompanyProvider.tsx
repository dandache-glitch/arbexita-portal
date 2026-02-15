"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/app/providers/AuthProvider";

export type Company = {
  id: string;
  owner_user_id: string;
  name: string;
  industry: string | null;
  annual_review_done: boolean;
  created_at: string;
};

export type CompanyContextValue = {
  isLoading: boolean;

  /**
   * Backwards-compatible fields (older pages).
   */
  companyId: string | null;
  companyName: string;
  industry: string;
  annualReviewDone: boolean;

  /**
   * Preferred: full company object.
   */
  company: Company | null;

  refresh: () => Promise<void>;
};

const CompanyContext = createContext<CompanyContextValue | null>(null);

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const { user, isLoading: authLoading } = useAuth();

  const [state, setState] = useState<Omit<CompanyContextValue, "refresh">>({
    isLoading: true,
    companyId: null,
    companyName: "Företaget",
    industry: "kontor",
    annualReviewDone: false,
    company: null,
  });

  const refresh = async () => {
    if (!user) {
      setState({
        isLoading: false,
        companyId: null,
        companyName: "Företaget",
        industry: "kontor",
        annualReviewDone: false,
        company: null,
      });
      return;
    }

    setState((s) => ({ ...s, isLoading: true }));

    // Robust: retry/backoff in case company is created by DB trigger right after signup
    const attempts = [0, 200, 400, 800, 1200]; // ms
    let lastError: string | null = null;

    for (const delay of attempts) {
      if (delay) await sleep(delay);

      const { data, error } = await supabase
        .from("companies")
        .select("id, owner_user_id, name, industry, annual_review_done, created_at")
        .eq("owner_user_id", user.id)
        .maybeSingle();

      if (error) {
        lastError = error.message;
        continue;
      }

      if (!data) {
        lastError = "Company not found yet";
        continue;
      }

      const c = data as Company;

      setState({
        isLoading: false,
        companyId: c.id,
        companyName: c.name || "Företaget",
        industry: c.industry || "kontor",
        annualReviewDone: Boolean(c.annual_review_done),
        company: c,
      });
      return;
    }

    console.error("CompanyProvider.refresh failed:", lastError);

    setState({
      isLoading: false,
      companyId: null,
      companyName: "Företaget",
      industry: "kontor",
      annualReviewDone: false,
      company: null,
    });
  };

  useEffect(() => {
    if (authLoading) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  const value: CompanyContextValue = {
    ...state,
    isLoading: authLoading || state.isLoading,
    refresh,
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}
