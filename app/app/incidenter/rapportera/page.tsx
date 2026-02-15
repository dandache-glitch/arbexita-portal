"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/app/providers/AuthProvider";
import { useCompany } from "@/app/providers/CompanyProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { Notice } from "@/components/ui/Notice";

const SEVERITIES = ["Tillbud", "Olycka", "Allvarligt tillbud"] as const;

export default function ReportIncidentPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const { user } = useAuth();
  const company = useCompany();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]>("Tillbud");
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user || !company.companyId) {
      setError("Inte inloggad.");
      return;
    }

    setSaving(true);

    const { data: incident, error: insErr } = await supabase
      .from("incidents")
      .insert({
        company_id: company.companyId,
        owner_user_id: user.id,
        title: title.trim(),
        severity,
        description: description.trim() || null
      })
      .select("id")
      .single();

    if (insErr) {
      setSaving(false);
      setError(insErr.message);
      return;
    }

    // Create follow-up action (idempotent in schema via unique index)
    if (incident?.id) {
      await supabase
        .from("actions")
        .upsert(
          {
            company_id: company.companyId,
            owner_user_id: user.id,
            title: `Uppföljning: ${title.trim()}`,
            description: "Automatisk uppföljning skapad från incidentrapport.",
            status: "open",
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            source_type: "incident",
            source_id: incident.id
          } as any,
          { onConflict: "company_id,source_type,source_id" }
        );
    }

    setSaving(false);
    router.replace("/app/incidenter");
  }

  return (
    <div className="container">
      <PageHeader
        title="Rapportera incident"
        subtitle={<>Incidenter ska följas upp. Arbexita skapar en uppföljningsåtgärd automatiskt.</>}
        right={<Link className="btn" href="/app/incidenter">Till incidenter</Link>}
      />

      <div className="card" style={{ padding: 16, marginTop: 14, maxWidth: 920 }}>
        {error ? <Notice tone="error">{error}</Notice> : null}

        <form onSubmit={onSubmit} style={{ marginTop: 12, display: "grid", gap: 14 }}>
          <div>
            <div className="label">Titel</div>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex. Snubbelrisk i lagergång" />
          </div>

          <div>
            <div className="label">Typ</div>
            <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value as any)}>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="label">Beskrivning</div>
            <textarea className="input" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Vad hände? Orsak? Föreslagen åtgärd?" />
          </div>

          <button className="btn btn-primary" disabled={saving || !title.trim()}>
            {saving ? "Sparar…" : "Skicka incident"}
          </button>

          <div className="small">En uppföljningsåtgärd skapas automatiskt med 7 dagars deadline (kan ändras under Åtgärder).</div>
        </form>
      </div>
    </div>
  );
}
