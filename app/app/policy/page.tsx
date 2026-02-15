"use client";

import { useState } from "react";
import { getContext } from "@/lib/app/db";

export default function PolicyPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const ctx = await getContext();

      // Ensure policy row exists (for compliance scoring)
      const { error: upsertErr } = await ctx.supabase.from("policies").upsert({
        company_id: ctx.companyId,
        owner_user_id: ctx.userId,
        updated_at: new Date().toISOString()
      }, { onConflict: "company_id" });

      if (upsertErr) throw upsertErr;

      const res = await fetch("/api/policy/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          companyName: ctx.companyName,
          industry: ctx.industry
        })
      });
      if (!res.ok) throw new Error("Kunde inte generera PDF.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setMsg("PDF skapad och öppnad i ny flik.");
    } catch (e: any) {
      setErr(e?.message || "Något gick fel.");
    }
    setLoading(false);
  }

  return (
    <div className="container">
      <div className="h1">Arbetsmiljöpolicy (PDF)</div>
      <div className="small" style={{ marginTop: 6 }}>
        En policy är en central del av SAM. Klicka för att generera en färdig PDF med företagets uppgifter.
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <button className="btn btn-primary" onClick={generate} disabled={loading}>
          {loading ? "Genererar..." : "Generera policy PDF"}
        </button>

        {msg && <div className="small" style={{ marginTop: 10, color: "rgba(56,211,159,1)" }}>{msg}</div>}
        {err && <div className="small" style={{ marginTop: 10, color: "#ffb4b4" }}>{err}</div>}

        <div className="small" style={{ marginTop: 12 }}>
          Tips: Håll policyn uppdaterad minst årligen och vid större förändringar.
        </div>
      </div>
    </div>
  );
}
