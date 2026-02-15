"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useCompany } from "@/app/providers/CompanyProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { getComplianceStatus, getDashboardStats } from "@/lib/app/queries";
import { computeComplianceScore } from "@/lib/app/compliance";

export default function Dashboard() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const company = useCompany();

  const [loading, setLoading] = useState(true);
  const [riskCount, setRiskCount] = useState(0);
  const [openActions, setOpenActions] = useState(0);
  const [overdueActions, setOverdueActions] = useState(0);
  const [incidentCount, setIncidentCount] = useState(0);
  const [policyExists, setPolicyExists] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!company.companyId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      const stats = await getDashboardStats(supabase, company.companyId!);
      const status = await getComplianceStatus(supabase, company.companyId!, company.annualReviewDone);

      if (cancelled) return;

      setRiskCount(stats.riskCount);
      setOpenActions(stats.openActions);
      setOverdueActions(stats.overdueActions);
      setIncidentCount(stats.incidentCount);
      setPolicyExists(stats.policyExists);
      setScore(computeComplianceScore(status));
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [company.companyId, company.annualReviewDone, supabase]);

  return (
    <div className="container">
      <PageHeader
        title="Dashboard"
        subtitle={
          <>
            {company.companyName} • Målet: <b>100% inspektionsredo</b>
          </>
        }
        right={
          <>
            <Link className="btn" href="/app/riskbedomningar/ny">Ny risk</Link>
            <Link className="btn" href="/app/incidenter/rapportera">Rapportera incident</Link>
            <Link className="btn btn-primary" href="/app/compliance">Bli 100% redo</Link>
          </>
        }
      />

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div className="h2">Compliance-score</div>
            <div className="small">Bygg dokumentation som håller vid arbetsmiljöinspektion.</div>
          </div>
          <div className="kpi">{loading || company.isLoading ? "…" : `${score}%`}</div>
        </div>

        <div className="progress-wrap">
          <div className="progress">
            <div style={{ width: `${score}%` }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <span className={policyExists ? "badge ok" : "badge"}>{policyExists ? "Policy: Klar" : "Policy: Saknas"}</span>
          <span className={overdueActions === 0 ? "badge ok" : "badge warn"}>
            {overdueActions === 0 ? "Åtgärder: Inga förfallna" : `Åtgärder: ${overdueActions} förfallna`}
          </span>
          <span className={company.annualReviewDone ? "badge ok" : "badge"}>
            {company.annualReviewDone ? "Årlig uppföljning: Klar" : "Årlig uppföljning: Ej markerad"}
          </span>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="h2">Riskbedömningar</div>
          <div className="kpi" style={{ marginTop: 8 }}>{loading ? "…" : riskCount}</div>
          <div className="small">Dokumenterade risker och prioritering.</div>
          <div style={{ marginTop: 10 }}>
            <Link className="btn" href="/app/riskbedomningar">Visa risker</Link>
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="h2">Åtgärder</div>
          <div className="kpi" style={{ marginTop: 8 }}>{loading ? "…" : openActions}</div>
          <div className="small">Öppna åtgärder som driver arbetet framåt.</div>
          <div style={{ marginTop: 10 }}>
            <Link className="btn" href="/app/atgarder">Visa åtgärder</Link>
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="h2">Incidenter</div>
          <div className="kpi" style={{ marginTop: 8 }}>{loading ? "…" : incidentCount}</div>
          <div className="small">Tillbud/olyckor med uppföljningsspår.</div>
          <div style={{ marginTop: 10 }}>
            <Link className="btn" href="/app/incidenter">Visa incidenter</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="h2">Policy (PDF)</div>
          <div className="small" style={{ marginTop: 6 }}>
            Generera och lagra en uppdateringsmarkering. PDF:n kan delas vid inspektion.
          </div>
          <div style={{ marginTop: 10 }}>
            <Link className="btn" href="/app/policy">Skapa/uppdatera policy</Link>
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="h2">Branschdokument</div>
          <div className="small" style={{ marginTop: 6 }}>
            Branschspecifika checklistor och dokument som matchar ditt val vid registrering.
          </div>
          <div style={{ marginTop: 10 }}>
            <Link className="btn" href="/app/dokument">Öppna dokument</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
