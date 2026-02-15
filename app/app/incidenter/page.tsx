"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getContext } from "@/lib/app/db";

type IncidentRow = {
  id: string;
  title: string;
  severity: string;
  created_at: string;
};

export default function IncidentsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<IncidentRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const ctx = await getContext();
      const { data, error } = await ctx.supabase
        .from("incidents")
        .select("id,title,severity,created_at")
        .eq("company_id", ctx.companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRows((data as any) || []);
    } catch (e: any) {
      setErr(e?.message || "Något gick fel.");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div className="h1">Incidenter</div>
          <div className="small">Rapportera tillbud/olyckor och skapa uppföljningsåtgärder.</div>
        </div>
        <Link className="btn btn-primary" href="/app/incidenter/rapportera">Rapportera incident</Link>
      </div>

      {err && <div className="card" style={{ padding: 16, marginTop: 14 }}><div className="small" style={{ color: "#ffb4b4" }}>{err}</div></div>}

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        {loading ? <div className="small">Laddar...</div> : rows.length === 0 ? (
          <div className="small">Inga incidenter ännu.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Titel</th>
                  <th>Allvarlighetsgrad</th>
                  <th>Datum</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>{r.title}</td>
                    <td>{r.severity}</td>
                    <td>{new Date(r.created_at).toLocaleDateString("sv-SE")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
