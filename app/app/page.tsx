"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getContext } from "@/lib/app/db";
import { COMPLIANCE_STEPS, INDUSTRIES } from "@/lib/app/industries";

type RiskRow = { id: string; level: number; status: string; created_at?: string };
type ActionRow = { id: string; status: string; due_date?: string | null };
type IncidentRow = { id: string };
type PolicyRow = { id: string };

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState<string>("Företaget");
  const [industry, setIndustry] = useState<string>("kontor");
  const [riskCount, setRiskCount] = useState(0);
  const [openActions, setOpenActions] = useState(0);
  const [overdueActions, setOverdueActions] = useState(0);
  const [incidentCount, setIncidentCount] = useState(0);
  const [policyExists, setPolicyExists] = useState(false);
  const [annualReviewDone, setAnnualReviewDone] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const ctx = await getContext();
        setCompanyName(ctx.companyName);
        setIndustry(ctx.industry);

        const [{ data: risks }, { data: actions }, { data: incidents }, { data: policies }, { data: companies }] =
          await Promise.all([
            ctx.supabase.from("risks").select("id, level, status, created_at").eq("company_id", ctx.companyId),
            ctx.supabase.from("actions").select("id, status, due_date").eq("company_id", ctx.companyId),
            ctx.supabase.from("incidents").select("id").eq("company_id", ctx.companyId),
            ctx.supabase.from("policies").select("id").eq("company_id", ctx.companyId).limit(1),
            ctx.supabase.from("companies").select("annual_review_done").eq("id", ctx.companyId).maybeSingle()
          ]);

        const r = (risks as RiskRow[] | null) ?? [];
        const a = (actions as ActionRow[] | null) ?? [];
        const i = (incidents as IncidentRow[] | null) ?? [];
        const p = (policies as PolicyRow[] | null) ?? [];
        const annual = Boolean((companies as any)?.annual_review_done);

        const open = a.filter(x => x.status !== "done").length;
        const overdue = a.filter(x => x.status !== "done" && x.due_date && new Date(x.due_date) < new Date()).length;

        setRiskCount(r.length);
        setOpenActions(open);
        setOverdueActions(overdue);
        setIncidentCount(i.length);
        setPolicyExists(p.length > 0);
        setAnnualReviewDone(annual);

        // compliance score from steps (each step worth equal weight)
        const stepDone: Record<string, boolean> = {
          policy: p.length > 0,
          risk: r.length > 0,
          actions: overdue === 0,
          incidents: i.length > 0,
          annual: annual
        };
        const doneCount = COMPLIANCE_STEPS.filter(s => stepDone[s.key]).length;
        const pct = Math.round((doneCount / COMPLIANCE_STEPS.length) * 100);
        setScore(pct);
      } catch {
        // ignore; AuthGuard handles auth
      }
      setLoading(false);
    }
    load();
  }, []);

  const industryName = INDUSTRIES.find(x => x.key === industry)?.name || "Bransch";

  return (
    <div className="container">
      <div className="h1">Dashboard</div>
      <div className="small" style={{ marginTop: 6 }}>
        {companyName} • {industryName} • Målet: <b>100% Redo för inspektion</b>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div className="h2">Compliance-score</div>
            <div className="small">Guidar dig steg-för-steg till dokumenterad SAM-efterlevnad.</div>
          </div>
          <div style={{ fontSize: 34, fontWeight: 800 }}>
            {loading ? "…" : `${score}%`}
          </div>
        </div>

        <div className="progress-wrap">
          <div className="progress">
            <div style={{ width: `${score}%` }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" href="/app/compliance">Bli 100% redo</Link>
          <Link className="btn" href="/app/riskbedomningar/ny">Ny riskbedömning</Link>
          <Link className="btn" href="/app/incidenter/rapportera">Rapportera incident</Link>
          <Link className="btn" href="/app/policy">Skapa policy PDF</Link>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="h2">Risker</div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>{loading ? "…" : riskCount}</div>
          <div className="small">Registrerade riskbedömningar.</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="h2">Öppna åtgärder</div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>{loading ? "…" : openActions}</div>
          <div className="small">{overdueActions > 0 ? `${overdueActions} förfallna` : "Inga förfallna"}.</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="h2">Incidenter</div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>{loading ? "…" : incidentCount}</div>
          <div className="small">Rapporterade tillbud/olyckor.</div>
        </div>
      </div>
    </div>
  );
}
