"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/app/providers/AuthProvider";
import { useCompany } from "@/app/providers/CompanyProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { Notice } from "@/components/ui/Notice";

export default function PolicyPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const { user } = useAuth();
  const company = useCompany();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setErr(null);
    setMsg(null);

    if (!user || !company.companyId) {
      setErr("Inte inloggad.");
      return;
    }

    setLoading(true);

    try {
      // Ensure policy marker exists (for compliance scoring)
      const { error: upsertErr } = await supabase
        .from("policies")
        .upsert(
          {
            company_id: company.companyId,
            owner_user_id: user.id,
            updated_at: new Date().toISOString()
          },
          { onConflict: "company_id" }
        );

      if (upsertErr) throw upsertErr;

      const res = await fetch("/api/policy/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          companyName: company.companyName,
          industry: company.industry
        })
      });

      if (!res.ok) throw new Error("Kunde inte generera PDF.");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setMsg("PDF skapad och öppnad i ny flik.");
    } catch (e: any) {
      setErr(e?.message || "Något gick fel.");
    }

    setLoading(false);
  }

  return (
    <div className="container">
      <PageHeader
        title="Arbetsmiljöpolicy (PDF)"
        subtitle={<>Policy är en central del av SAM. Här kan du generera en standardiserad policy som PDF.</>}
        right={<Link className="btn" href="/app">Dashboard</Link>}
      />

      <div className="card" style={{ padding: 16, marginTop: 14, maxWidth: 920 }}>
        <button className="btn btn-primary" onClick={generate} disabled={loading}>
          {loading ? "Genererar…" : "Generera policy PDF"}
        </button>

        {msg ? <div style={{ marginTop: 12 }}><Notice tone="success">{msg}</Notice></div> : null}
        {err ? <div style={{ marginTop: 12 }}><Notice tone="error">{err}</Notice></div> : null}

        <div className="small" style={{ marginTop: 12 }}>
          Tips: Håll policyn uppdaterad minst årligen och vid större förändringar.
        </div>
      </div>
    </div>
  );
}
