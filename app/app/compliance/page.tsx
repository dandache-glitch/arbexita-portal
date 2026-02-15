"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useCompany } from "@/app/providers/CompanyProvider";

type ComplianceStatus = {
  score: number; // 0..100
  ready: boolean;
  steps: {
    policyCreated: boolean;
    hasRisk: boolean;
    noOverdueActions: boolean;
    hasIncident: boolean;
    annualReviewDone: boolean;
  };
  meta: {
    overdueActionsCount: number;
    openActionsCount: number;
    risksCount: number;
    incidentsCount: number;
  };
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function computeScore(steps: ComplianceStatus["steps"]) {
  // 5 steg, lika vikt
  const parts = [
    steps.policyCreated,
    steps.hasRisk,
    steps.noOverdueActions,
    steps.hasIncident,
    steps.annualReviewDone,
  ];
  const ok = parts.filter(Boolean).length;
  return Math.round((ok / parts.length) * 100);
}

async function getComplianceStatus(
  supabase: ReturnType<typeof supabaseBrowser>,
  companyId: string,
  annualReviewDone: boolean
): Promise<ComplianceStatus> {
  // Policy: finns rad i policies (PK = company_id i din nuvarande modell)
  const policyQ = await supabase.from("policies").select("company_id").eq("company_id", companyId).maybeSingle();
  const policyCreated = Boolean(policyQ.data) && !policyQ.error;

  // Minst en risk
  const risksCountQ = await supabase
    .from("risks")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);

  const risksCount = risksCountQ.count ?? 0;
  const hasRisk = risksCount > 0;

  // Incident minst en
  const incidentsCountQ = await supabase
    .from("incidents")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);

  const incidentsCount = incidentsCountQ.count ?? 0;
  const hasIncident = incidentsCount > 0;

  // Åtgärder open/done och overdue
  const openActionsQ = await supabase
    .from("actions")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .neq("status", "done");

  const openActionsCount = openActionsQ.count ?? 0;

  const nowIso = new Date().toISOString();

  const overdueQ = await supabase
    .from("actions")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .neq("status", "done")
    .not("due_date", "is", null)
    .lt("due_date", nowIso);

  const overdueActionsCount = overdueQ.count ?? 0;
  const noOverdueActions = overdueActionsCount === 0;

  const steps = {
    policyCreated,
    hasRisk,
    noOverdueActions,
    hasIncident,
    annualReviewDone,
  };

  const score = clamp(computeScore(steps), 0, 100);

  return {
    score,
    ready: score === 100,
    steps,
    meta: {
      overdueActionsCount,
      openActionsCount,
      risksCount,
      incidentsCount,
    },
  };
}

export default function CompliancePage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const { isLoading: companyLoading, company } = useCompany();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ComplianceStatus | null>(null);

  async function refresh() {
    setError(null);

    if (companyLoading) {
      setLoading(true);
      return;
    }

    if (!company?.id) {
      setStatus(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const s = await getComplianceStatus(supabase, company.id, company.annual_review_done);
      setStatus(s);
      setLoading(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Okänt fel";
      setError(msg);
      setStatus(null);
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyLoading, company?.id, company?.annual_review_done]);

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1>Compliance</h1>
          <p>Se status och vad som krävs för att vara “redo för arbetsmiljöinspektion”.</p>
        </div>
        <div className="pageHeaderActions">
          <button className="button secondary" onClick={() => refresh()} disabled={loading || companyLoading}>
            Uppdatera
          </button>
        </div>
      </div>

      <div className="card">
        {error && <div className="errorBox">{error}</div>}

        {companyLoading || loading ? (
          <div className="muted">Laddar…</div>
        ) : !company?.id ? (
          <div className="muted">Inget företag hittades för kontot.</div>
        ) : !status ? (
          <div className="muted">Kunde inte läsa compliance-status.</div>
        ) : (
          <>
            <div className="complianceTop">
              <div>
                <div className="complianceScore">{status.score}%</div>
                <div className="muted">Compliance score</div>
              </div>

              <div>
                <span className={`badge ${status.ready ? "ok" : "warn"}`}>
                  {status.ready ? "Redo för inspektion" : "Inte redo ännu"}
                </span>
              </div>
            </div>

            <div className="divider" />

            <h2 className="sectionTitle">Checklista</h2>

            <ul className="checklist">
              <li className={status.steps.policyCreated ? "ok" : "todo"}>
                <span>Arbetsmiljöpolicy skapad</span>
                <span className="muted">{status.steps.policyCreated ? "Klar" : "Saknas"}</span>
              </li>

              <li className={status.steps.hasRisk ? "ok" : "todo"}>
                <span>Minst en riskbedömning</span>
                <span className="muted">{status.meta.risksCount} st</span>
              </li>

              <li className={status.steps.noOverdueActions ? "ok" : "todo"}>
                <span>Inga förfallna åtgärder</span>
                <span className="muted">{status.meta.overdueActionsCount} förfallna</span>
              </li>

              <li className={status.steps.hasIncident ? "ok" : "todo"}>
                <span>Incident rapporterad</span>
                <span className="muted">{status.meta.incidentsCount} st</span>
              </li>

              <li className={status.steps.annualReviewDone ? "ok" : "todo"}>
                <span>Årlig uppföljning markerad</span>
                <span className="muted">{status.steps.annualReviewDone ? "Klar" : "Saknas"}</span>
              </li>
            </ul>

            <div className="divider" />

            <h2 className="sectionTitle">Snabbstatistik</h2>
            <div className="statsRow">
              <div className="statCard">
                <div className="statLabel">Öppna åtgärder</div>
                <div className="statValue">{status.meta.openActionsCount}</div>
              </div>

              <div className="statCard">
                <div className="statLabel">Förfallna</div>
                <div className="statValue">{status.meta.overdueActionsCount}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
