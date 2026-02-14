"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

type RiskRow = { id: string; level: number; status: string };
type ActionRow = { id: string; status: string };
type IncidentRow = { id: string };

export default function AppDashboardPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [loading, setLoading] = useState(true);
  const [riskCount, setRiskCount] = useState(0);
  const [openActions, setOpenActions] = useState(0);
  const [incidentCount, setIncidentCount] = useState(0);
  const [policyExists, setPolicyExists] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // AuthGuard ser till att vi har session, men vi dubbelkollar ändå
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setLoading(false);
        return;
      }

      // Hämta aktuell användare
      const userId = sessionData.session.user.id;

      // Hämta company_id från companies (skapas normalt vid register; annars fallback)
      const { data: companyRow } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_user_id", userId)
        .maybeSingle();

      const companyId = companyRow?.id;

      if (!companyId) {
        // Om company saknas (t.ex. man skapade user direkt i Supabase) så visa tom dashboard.
        setRiskCount(0);
        setOpenActions(0);
        setIncidentCount(0);
        setPolicyExists(false);
        setScore(0);
        setLoading(false);
        return;
      }

      const [{ data: risks }, { data: actions }, { data: incidents }, { data: policies }] =
        await Promise.all([
          supabase.from("risks").select("id, level, status").eq("company_id", companyId),
          supabase.from("actions").select("id, status").eq("company_id", companyId),
          supabase.from("incidents").select("id").eq("company_id", companyId),
          supabase.from("policies").select("id").eq("company_id", companyId).limit(1),
        ]);

      const r = (risks as RiskRow[] | null) ?? [];
      const a = (actions as ActionRow[] | null) ?? [];
      const i = (incidents as IncidentRow[] | null) ?? [];
      const p = (policies ?? []) as { id: string }[];

      const highOpenRisks = r.filter((x) => (x.level ?? 0) >= 9 && x.status !== "closed").length;
      const openActs = a.filter((x) => x.status !== "done").length;

      setRiskCount(r.length);
      setOpenActions(openActs);
      setIncidentCount(i.length);
      setPolicyExists(p.length > 0);

      // Enkel compliance score (0–100)
      // - Start 100
      // - minus 30 om ingen policy
      // - minus 10 per hög öppen risk (max 40)
      // - minus 5 per öppen åtgärd (max 30)
      let s = 100;
      if (p.length === 0) s -= 30;
      s -= Math.min(40, highOpenRisks * 10);
      s -= Math.min(30, openActs * 5);
      s = Math.max(0, Math.min(100, s));
      setScore(s);

      setLoading(false);
    }

    load();
  }, [supabase]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="h1">Dashboard</div>
        <div className="small mt-1">Överblick över SAM och efterlevnad i Arbexita.</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="label">Compliance Score</div>
          <div className="text-3xl font-semibold mt-2">{loading ? "…" : `${score}%`}</div>
          <div className="small mt-2">Enkel indikator baserad på policy, risker och åtgärder.</div>
        </div>

        <div className="card p-4">
          <div className="label">Risker</div>
          <div className="text-3xl font-semibold mt-2">{loading ? "…" : riskCount}</div>
          <div className="small mt-2">Totalt antal registrerade risker.</div>
        </div>

        <div className="card p-4">
          <div className="label">Öppna åtgärder</div>
          <div className="text-3xl font-semibold mt-2">{loading ? "…" : openActions}</div>
          <div className="small mt-2">Åtgärder som inte är klara.</div>
        </div>

        <div className="card p-4">
          <div className="label">Incidenter</div>
          <div className="text-3xl font-semibold mt-2">{loading ? "…" : incidentCount}</div>
          <div className="small mt-2">Rapporterade incidenter/tillbud.</div>
        </div>
      </div>

      {!policyExists && !loading && (
        <div className="card p-4">
          <div className="font-semibold">Ingen policy hittad</div>
          <div className="small mt-1">
            Om du skapade användare direkt i Supabase kan företagsposten saknas. Skapa en policy eller registrera
            ett konto via portalen.
          </div>
          <div className="mt-3">
            <Link className="btn btn-primary" href="/app/policy">
              Skapa policy
            </Link>
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="font-semibold">Snabbåtgärder</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link className="btn btn-primary" href="/app/riskbedomningar/ny">
            Ny riskbedömning
          </Link>
          <Link className="btn" href="/app/incidenter/rapportera">
            Rapportera incident
          </Link>
          <Link className="btn" href="/app/atgarder/ny">
            Ny åtgärd
          </Link>
          <Link className="btn" href="/app/policy">
            Policy / PDF
          </Link>
        </div>
      </div>
    </div>
  );
}
