"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useCompany } from "@/app/providers/CompanyProvider";

type IncidentRow = {
  id: string;
  title: string;
  severity: string | null;
  description: string | null;
  created_at: string;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("sv-SE");
}

export default function IncidentsPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const { isLoading: companyLoading, company } = useCompany();

  const [rows, setRows] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(companyId: string) {
    setError(null);
    setLoading(true);

    const { data, error: qErr } = await supabase
      .from("incidents")
      .select("id,title,severity,description,created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (qErr) {
      setError(qErr.message);
      setRows([]);
      setLoading(false);
      return;
    }

    setRows((data as IncidentRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (companyLoading) {
      setLoading(true);
      return;
    }

    if (!company?.id) {
      setRows([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      await load(company.id);
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyLoading, company?.id]);

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1>Incidenter</h1>
          <p>Rapportera och följ upp incidenter och tillbud.</p>
        </div>
        <div className="pageHeaderActions">
          <a className="button secondary" href="/app/incidenter/rapportera">
            Rapportera incident
          </a>
        </div>
      </div>

      <div className="card">
        {error && <div className="errorBox">{error}</div>}

        {companyLoading || loading ? (
          <div className="muted">Laddar…</div>
        ) : !company?.id ? (
          <div className="muted">Inget företag hittades för kontot.</div>
        ) : rows.length === 0 ? (
          <div className="muted">Inga incidenter rapporterade ännu.</div>
        ) : (
          <div className="table">
            <div className="tableHead">
              <div>Titel</div>
              <div>Allvarlighetsgrad</div>
              <div>Datum</div>
            </div>

            {rows.map((r) => (
              <div key={r.id} className="tableRow">
                <div className="tableMain">
                  <div className="tableTitle">{r.title}</div>
                  {r.description ? <div className="tableSub">{r.description}</div> : null}
                </div>
                <div>
                  <span className="badge">{r.severity ?? "—"}</span>
                </div>
                <div>{formatDate(r.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
