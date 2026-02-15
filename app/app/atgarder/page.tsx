"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getContext } from "@/lib/app/db";

type ActionRow = {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  created_at: string;
};

export default function ActionsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ActionRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const ctx = await getContext();
      const { data, error } = await ctx.supabase
        .from("actions")
        .select("id,title,status,due_date,created_at")
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

  async function markDone(id: string) {
    const ctx = await getContext();
    await ctx.supabase.from("actions").update({ status: "done" }).eq("id", id);
    load();
  }

  function badge(row: ActionRow) {
    const overdue = row.status !== "done" && row.due_date && new Date(row.due_date) < new Date();
    if (row.status === "done") return <span className="badge ok">Klar</span>;
    if (overdue) return <span className="badge danger">Förfallen</span>;
    return <span className="badge warn">Öppen</span>;
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div className="h1">Åtgärder</div>
          <div className="small">Åtgärdsplan med deadline – noll förfallna = högre compliance.</div>
        </div>
        <Link className="btn btn-primary" href="/app/atgarder/ny">Ny åtgärd</Link>
      </div>

      {err && <div className="card" style={{ padding: 16, marginTop: 14 }}><div className="small" style={{ color: "#ffb4b4" }}>{err}</div></div>}

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        {loading ? <div className="small">Laddar...</div> : rows.length === 0 ? (
          <div className="small">Inga åtgärder ännu.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Titel</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>{r.title}</td>
                    <td>{r.due_date ? new Date(r.due_date).toLocaleDateString("sv-SE") : "-"}</td>
                    <td>{badge(r)}</td>
                    <td style={{ width: 140 }}>
                      {r.status !== "done" ? (
                        <button className="btn" onClick={() => markDone(r.id)}>Markera klar</button>
                      ) : null}
                    </td>
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
