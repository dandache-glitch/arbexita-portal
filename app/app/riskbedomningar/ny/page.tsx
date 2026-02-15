"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/app/providers/AuthProvider";
import { useCompany } from "@/app/providers/CompanyProvider";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { riskLevel, riskTone } from "@/lib/app/risk";

export default function NewRiskPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const { user } = useAuth();
  const company = useCompany();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [area, setArea] = useState("Arbetsplats");
  const [probability, setProbability] = useState(3);
  const [consequence, setConsequence] = useState(3);
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const level = riskLevel(probability, consequence);
  const tone = riskTone(level);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user || !company.companyId) {
      setError("Inte inloggad.");
      return;
    }

    setSaving(true);

    const { data: risk, error: riskErr } = await supabase
      .from("risks")
      .insert({
        company_id: company.companyId,
        owner_user_id: user.id,
        title: title.trim(),
        area: area.trim(),
        probability,
        consequence,
        level,
        status: "open",
        notes: notes.trim() || null
      })
      .select("id")
      .single();

    if (riskErr) {
      setSaving(false);
      setError(riskErr.message);
      return;
    }

    // If schema supports source-based auto-actions, try to create (idempotent via unique index).
    if (level >= 9 && risk?.id) {
      await supabase
        .from("actions")
        .upsert(
          {
            company_id: company.companyId,
            owner_user_id: user.id,
            title: `Åtgärd: ${title.trim()}`,
            description: `Automatiskt skapad från riskbedömning (risknivå ${level}).`,
            status: "open",
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            source_type: "risk",
            source_id: risk.id
          } as any,
          { onConflict: "company_id,source_type,source_id" }
        );
    }

    setSaving(false);
    setSuccess(level >= 9 ? "Risk sparad. Åtgärd skapades automatiskt." : "Risk sparad.");

    // go back to list
    router.replace("/app/riskbedomningar");
  }

  return (
    <div className="container">
      <PageHeader
        title="Ny riskbedömning"
        subtitle={<>Risknivå = sannolikhet × konsekvens. Risknivå ≥ 9 skapar automatiskt en åtgärd.</>}
        right={
          <>
            <Link className="btn" href="/app/riskbedomningar">Till risklistan</Link>
          </>
        }
      />

      <div className="card" style={{ padding: 16, marginTop: 14, maxWidth: 920 }}>
        {error ? <Notice tone="error">{error}</Notice> : null}
        {success ? <div style={{ marginTop: 12 }}><Notice tone="success">{success}</Notice></div> : null}

        <form onSubmit={onSubmit} style={{ marginTop: 12, display: "grid", gap: 14 }}>
          <div>
            <div className="label">Titel</div>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex. Halkrisk vid entré" />
          </div>

          <div className="grid grid-2">
            <div>
              <div className="label">Område</div>
              <input className="input" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
            <div>
              <div className="label">Risknivå</div>
              <div className="notice" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 850 }}>{level}</div>
                  <div className="small">Sannolikhet {probability} × Konsekvens {consequence}</div>
                </div>
                <span className={`badge ${tone}`}>{tone === "danger" ? "Hög" : tone === "warn" ? "Måttlig" : "Låg"}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-2">
            <div>
              <div className="label">Sannolikhet (1–5)</div>
              <input className="input" type="number" min={1} max={5} value={probability} onChange={(e) => setProbability(Number(e.target.value))} />
            </div>
            <div>
              <div className="label">Konsekvens (1–5)</div>
              <input className="input" type="number" min={1} max={5} value={consequence} onChange={(e) => setConsequence(Number(e.target.value))} />
            </div>
          </div>

          <div>
            <div className="label">Notering</div>
            <textarea className="input" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ev. orsaker, skyddsåtgärder, rekommendationer…" />
          </div>

          <button className="btn btn-primary" disabled={saving || !title.trim()}>
            {saving ? "Sparar…" : "Spara riskbedömning"}
          </button>

          <div className="small">
            Obs: För hög risk (≥ 9) krävs åtgärd med deadline enligt god SAM-praxis.
          </div>
        </form>
      </div>
    </div>
  );
}
