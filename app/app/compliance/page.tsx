"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { COMPLIANCE_STEPS } from "@/lib/app/industries";
import { getContext } from "@/lib/app/db";

export default function CompliancePage() {
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const ctx = await getContext();

      const [{ data: policies }, { data: risks }, { data: actions }, { data: incidents }, { data: company }] =
        await Promise.all([
          ctx.supabase.from("policies").select("id").eq("company_id", ctx.companyId).limit(1),
          ctx.supabase.from("risks").select("id").eq("company_id", ctx.companyId).limit(1),
          ctx.supabase.from("actions").select("id, status, due_date").eq("company_id", ctx.companyId),
          ctx.supabase.from("incidents").select("id").eq("company_id", ctx.companyId).limit(1),
          ctx.supabase.from("companies").select("annual_review_done").eq("id", ctx.companyId).maybeSingle()
        ]);

      const overdue = ((actions as any[]) || []).filter(
        (x) => x.status !== "done" && x.due_date && new Date(x.due_date) < new Date()
      ).length;

      const annual = Boolean((company as any)?.annual_review_done);

      const state: Record<string, boolean> = {
        policy: ((policies as any[]) || []).length > 0,
        risk: ((risks as any[]) || []).length > 0,
        actions: overdue === 0,
        incidents: ((incidents as any[]) || []).length > 0,
        annual
      };

      const doneCount = COMPLIANCE_STEPS.filter((s) => Boolean(state[s.key])).length;
      setScore(Math.round((doneCount / COMPLIANCE_STEPS.length) * 100));
      setDone(state);
      setLoading(false);
    }

    load();
  }, []);

  async function setAnnualDone(v: boolean) {
    const ctx = await getContext();
    await ctx.supabase.from("companies").update({ annual_review_done: v }).eq("id", ctx.companyId);

    // Viktigt: typa som Record<string, boolean> så TS tillåter indexering med s.key (string)
    const newDone: Record<string, boolean> = { ...done, annual: v };
    setDone(newDone);

    const doneCount = COMPLIANCE_STEPS.filter((s) => Boolean(newDone[s.key])).length;
    setScore(Math.round((doneCount / COMPLIANCE_STEPS.length) * 100));
  }

  return (
    <div className="container">
      <div className="h1">Redo för inspektion</div>
      <div className="small" style={{ marginTop: 6 }}>
        Tänk: “Arbetsmiljöombudet knackar på i morgon.” Följ stegen nedan tills du når 100%.
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div className="h2">Din status</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>{loading ? "…" : `${score}%`}</div>
        </div>

        <div className="progress-wrap">
          <div className="progress">
            <div style={{ width: `${score}%` }} />
          </div>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        {COMPLIANCE_STEPS.map((s) => (
          <div className="card" style={{ padding: 16 }} key={s.key}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <div className="h2">{s.title}</div>
                <div className="small" style={{ marginTop: 6 }}>
                  {s.why}
                </div>
                <div className="small" style={{ marginTop: 6 }}>
                  <span className="badge">{s.lawHint}</span>
                </div>
              </div>
              <div>{done[s.key] ? <span className="badge ok">Klar</span> : <span className="badge warn">Ej klar</span>}</div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              {s.key === "policy" && (
                <Link className="btn btn-primary" href="/app/policy">
                  Skapa policy
                </Link>
              )}
              {s.key === "risk" && (
                <Link className="btn btn-primary" href="/app/riskbedomningar/ny">
                  Skapa riskbedömning
                </Link>
              )}
              {s.key === "actions" && (
                <Link className="btn btn-primary" href="/app/atgarder">
                  Se åtgärder
                </Link>
              )}
              {s.key === "incidents" && (
                <Link className="btn btn-primary" href="/app/incidenter/rapportera">
                  Rapportera incident
                </Link>
              )}
              {s.key === "annual" && (
                <>
                  <button className="btn btn-primary" onClick={() => setAnnualDone(true)}>
                    Markera årlig uppföljning klar
                  </button>
                  {done[s.key] && (
                    <button className="btn" onClick={() => setAnnualDone(false)}>
                      Ångra
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
