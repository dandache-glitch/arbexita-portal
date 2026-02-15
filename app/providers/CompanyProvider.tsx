"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useAuth } from "@/app/providers/AuthProvider";

type Company = {
  id: string;
  owner_user_id: string;
  name: string;
  industry: string | null;
  annual_review_done: boolean;
  created_at: string;
};

type CompanyState = {
  isLoading: boolean;
  company: Company | null;
  refresh: () => Promise<void>;
};

const CompanyContext = createContext<CompanyState | null>(null);

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const { isLoading: authLoading, user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);

  const loadCompany = async () => {
    if (!user) {
      setCompany(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Robust: retry några gånger ifall company inte hunnit skapas/propageras
    const attempts = [0, 200, 400, 800, 1200]; // ms backoff
    let lastErr: string | null = null;

    for (const delay of attempts) {
      if (delay > 0) await sleep(delay);

      const { data, error } = await supabase
        .from("companies")
        .select("id, owner_user_id, name, industry, annual_review_done, created_at")
        .eq("owner_user_id", user.id)
        .maybeSingle();

      if (error) {
        lastErr = error.message;
        continue;
      }

      if (data) {
        setCompany(data as Company);
        setIsLoading(false);
        return;
      }

      // Ingen data ännu — retry
      lastErr = "Company not found yet";
    }

    // Efter retries: lämna tydligt state (kan visas i UI om du vill)
    console.error("Company load failed:", lastErr);
    setCompany(null);
    setIsLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    // auth klar => hämta company
    void loadCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  const value: CompanyState = {
    isLoading,
    company,
    refresh: loadCompany,
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}
