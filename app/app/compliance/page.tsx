"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useCompany } from "@/app/providers/CompanyProvider";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { getComplianceStatus } from "@/lib/app/queries";
import { computeComplianceScore } from "@/lib/app/compliance";

const STEPS = [
  {
    key: "policy" as const,
    title: "Arbetsmiljöpolicy",
    desc: "Skapa/uppdatera policy som PDF."
  },
  {
    key: "risk" as const,
    title: "Minst en riskbedömning",
    desc: "Dokumentera risker och prioritering (S×K)."
  },
  {
    key: "actions" as const,
    title: "Inga förfallna åtgärder",
    desc: "Åtgärder ska ha status och deadline."
  },
  {
    key: "incidents" as const,
    title: "Incidentrapportering",
    desc: "Rapportera tillbud/olyckor och följ upp."
  },
  {
    key: "annual" as const,
    title: "Årlig uppföljning",
    desc: "Markera att SAM följts upp och förbättrats."
  }
];

export default function CompliancePage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const company = useCompany();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState({
    policy: false,
    risk: false,
    actions: false,
    incidents: false,
    annual: false,
    overdueActions: 0
  });

  const score = computeComplianceScore(status as any);

  async function refresh() {
    if (!company.companyId) return;
    setError(null);
    setLoading(true);
    const s = await getComplianceStatus(supabase, company.companyId, company.annualReviewDone);
    setStatus(s);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.companyId, company.annualReviewDone]);

  async function toggleAnnualReview(done: boolean) {
    if (!company.companyId) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("companies")
      .update({ annual_review_done: done })
      .eq("id", company.companyId);

    if (error) {
      setSaving(false);
      setError(error.message);
      return;
    }

    await company.refresh();
    await refresh();
    setSaving(false);
  }

  return (
    <div className="container">
      <PageHeader
        title="Redo för inspektion"
        subtitle={
          <>
            Checklistan visar vad som saknas för att nå <b>100%</b>. All data sparas i din SAM-dokumentation.
          </>
        }
        right={
          <>
            <Link className="btn" href="/app">Till dashboard</Link>
            <Link className="btn btn-primary" href="/app/policy">Skapa policy</Link>
          </>
        }
      />

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div className="h2">Compliance-score</div>
            <div className="small">Baserad på fem obligatoriska steg.</div>
          </div>
          <div className="kpi">{loading ? "…" : `${score}%`}</div>
        </div>
        <div className="progress-wrap">
          <div className="progress">
            <div style={{ width: `${score}%` }} />
          </div>
        </div>

        {error ? <div style={{ marginTop: 12 }}><Notice tone="error">{error}</Notice></div> : null}
      </div>

      <div className="card" style={{ padding: 16, marginTop: 16 }}>
        <div className="h2">Checklista</div>
        <div className="small" style={{ marginTop: 6 }}>
          När alla punkter är klara är du “inspektionsredo” i Arbexita.
        </div>

        <div className="hr" />

        <div style={{ display: "grid", gap: 10 }}>
          {STEPS.map((s) => {
            const done = (status as any)[s.key] as boolean;
            return (
              <div key={s.key} className="notice" style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span className={done ? "badge ok" : "badge"}>{done ? "Klar" : "Saknas"}</span>
                    <div style={{ fontWeight: 800 }}>{s.title}</div>
                  </div>
                  <div className="small" style={{ marginTop: 4 }}>{s.desc}</div>
                  {s.key === "actions" && status.overdueActions > 0 ? (
                    <div className="small" style={{ marginTop: 4 }}>Du har {status.overdueActions} förfallna åtgärder.</div>
                  ) : null}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {s.key === "policy" ? <Link className="btn" href="/app/policy">Öppna</Link> : null}
                  {s.key === "risk" ? <Link className="btn" href="/app/riskbedomningar">Öppna</Link> : null}
                  {s.key === "actions" ? <Link className="btn" href="/app/atgarder">Öppna</Link> : null}
                  {s.key === "incidents" ? <Link className="btn" href="/app/incidenter">Öppna</Link> : null}
                  {s.key === "annual" ? (
                    <>
                      <button className="btn" disabled={saving} onClick={() => toggleAnnualReview(true)}>
                        Markera klar
                      </button>
                      <button className="btn" disabled={saving} onClick={() => toggleAnnualReview(false)}>
                        Ångra
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="small" style={{ marginTop: 14 }}>
        Tips: Gör riskbedömningen först. Höga risker ska följas av åtgärdsplan med ansvar och deadline.
      </div>
    </div>
  );
}
