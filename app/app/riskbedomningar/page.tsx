"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getContext } from "@/lib/app/db";

type RiskRow = {
  id: string;
  title: string;
  area: string;
  probability: number;
  consequence: number;
  level: number;
  status: string;
  created_at: string;
};

export default function RiskListPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RiskRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const ctx = await getContext();
        const { data, error } = await ctx.supabase
          .from("risks")
          .select("id,title,area,probability,consequence,level,status,created_at")
          .eq("company_id", ctx.companyId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setRows((data as any) || []);
      } catch (e: any) {
        setErr(e?.message || "Något gick fel.");
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div className="h1">Riskbedömningar</div>
          <div className="small">Dokumentera risker. Höga risker skapar åtgärder automatiskt.</div>
        </div>
        <Link className="btn btn-primary" href="/app/riskbedomningar/ny">Ny riskbedömning</Link>
      </div>

      {err && <div className="card" style={{ padding: 16, marginTop: 14 }}><div className="small" style={{ color: "#ffb4b4" }}>{err}</div></div>}

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        {loading ? (
          <div className="small">Laddar...</div>
        ) : rows.length === 0 ? (
          <div className="small">Inga riskbedömningar ännu.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Titel</th>
                  <th>Område</th>
                  <th>Risknivå</th>
                  <th>Status</th>
                  <th>Skapad</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>{r.title}</td>
                    <td>{r.area}</td>
                    <td><b>{r.level}</b></td>
                    <td>{r.status}</td>
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
