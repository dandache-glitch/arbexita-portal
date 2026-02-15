"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useCompany } from "@/app/providers/CompanyProvider";

type ActionRow = {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "done";
  due_date: string | null;
  created_at: string;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("sv-SE");
}

export default function ActionsPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const { isLoading: companyLoading, company, refresh } = useCompany();

  const [rows, setRows] = useState<ActionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);

    if (companyLoading) {
      setLoading(true);
      return;
    }

    if (!company?.id) {
      setLoading(false);
      setRows([]);
      return;
    }

    setLoading(true);

    const { data, error: qErr } = await supabase
      .from("actions")
      .select("id,title,description,status,due_date,created_at")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });

    if (qErr) {
      setError(qErr.message);
      setRows([]);
      setLoading(false);
      return;
    }

    setRows((data as ActionRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyLoading, company?.id]);

  async function markDone(id: string) {
    setError(null);
    if (!company?.id) return;

    // Optimistisk UI
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "done" } : r)));

    const { error: upErr } = await supabase
      .from("actions")
      .update({ status: "done" })
      .eq("id", id)
      .eq("company_id", company.id);

    if (upErr) {
      setError(upErr.message);
      await refresh();
      await load();
    }
  }

  const openCount = rows.filter((r) => r.status !== "done").length;
  const doneCount = rows.filter((r) => r.status === "done").length;

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1>Åtgärder</h1>
          <p>Planera, följ upp och markera åtgärder som klara.</p>
        </div>
        <div className="pageHeaderActions">
          <a className="button secondary" href="/app/atgarder/ny">
            Ny åtgärd
          </a>
        </div>
      </div>

      <div className="statsRow">
        <div className="statCard">
          <div className="statLabel">Öppna</div>
          <div className="statValue">{openCount}</div>
        </div>
        <div className="statCard">
          <div className="statLabel">Klarmarkerade</div>
          <div className="statValue">{doneCount}</div>
        </div>
      </div>

      <div className="card">
        {error && <div className="errorBox">{error}</div>}

        {companyLoading || loading ? (
          <div className="muted">Laddar…</div>
        ) : !company?.id ? (
          <div className="muted">Inget företag hittades för kontot.</div>
        ) : rows.length === 0 ? (
          <div className="muted">Inga åtgärder ännu. Skapa din första åtgärd.</div>
        ) : (
          <div className="table">
            <div className="tableHead">
              <div>Titel</div>
              <div>Deadline</div>
              <div>Status</div>
              <div></div>
            </div>

            {rows.map((r) => (
              <div key={r.id} className="tableRow">
                <div className="tableMain">
                  <div className="tableTitle">{r.title}</div>
                  {r.description ? <div className="tableSub">{r.description}</div> : null}
                </div>
                <div>{formatDate(r.due_date)}</div>
                <div>
                  <span className={`badge ${r.status === "done" ? "ok" : "warn"}`}>
                    {r.status === "done" ? "Klar" : "Öppen"}
                  </span>
                </div>
                <div className="tableActions">
                  {r.status !== "done" ? (
                    <button className="button small" onClick={() => markDone(r.id)}>
                      Markera klar
                    </button>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
