"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useCompany } from "@/app/providers/CompanyProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { Notice } from "@/components/ui/Notice";

type ActionRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  created_at: string;
  source_type?: string | null;
};

function isOverdue(due: string | null, status: string) {
  if (!due) return false;
  if (status === "done") return false;
  return new Date(due) < new Date(new Date().toISOString().slice(0, 10));
}

export default function ActionsPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const company = useCompany();

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rows, setRows] = useState<ActionRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!company.companyId) return;

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("actions")
      .select("id,title,description,status,due_date,created_at,source_type")
      .eq("company_id", company.companyId)
      .order("status", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    setRows(((data as any[]) ?? []) as ActionRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.companyId]);

  async function markDone(id: string, done: boolean) {
    setSavingId(id);
    setError(null);

    const { error } = await supabase
      .from("actions")
      .update({ status: done ? "done" : "open" })
      .eq("id", id)
      .eq("company_id", company.companyId);

    if (error) {
      setSavingId(null);
      setError(error.message);
      return;
    }

    await load();
    setSavingId(null);
  }

  return (
    <div className="container">
      <PageHeader
        title="Åtgärder"
        subtitle={<>Håll koll på ansvar, deadline och status. Inga förfallna åtgärder = compliance-poäng.</>}
        right={
          <>
            <Link className="btn" href="/app">Dashboard</Link>
            <Link className="btn btn-primary" href="/app/atgarder/ny">Ny åtgärd</Link>
          </>
        }
      />

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        {error ? <Notice tone="error">{error}</Notice> : null}

        <table className="table" style={{ marginTop: error ? 12 : 0 }}>
          <thead>
            <tr>
              <th>Åtgärd</th>
              <th>Deadline</th>
              <th>Status</th>
              <th style={{ width: 180 }}> </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="small">Laddar…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="small">Inga åtgärder ännu. Skapa en åtgärd eller generera via risk/incident.</td></tr>
            ) : (
              rows.map((a) => {
                const overdue = isOverdue(a.due_date, a.status);
                return (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 800 }}>{a.title}</div>
                      {a.description ? <div className="small" style={{ marginTop: 2 }}>{a.description}</div> : null}
                      {a.source_type ? <div className="small" style={{ marginTop: 2 }}>Källa: {a.source_type}</div> : null}
                    </td>
                    <td>
                      {a.due_date ? (
                        <span className={overdue ? "badge warn" : "badge"}>{new Date(a.due_date).toLocaleDateString("sv-SE")}</span>
                      ) : (
                        <span className="small">–</span>
                      )}
                    </td>
                    <td>
                      <span className={a.status === "done" ? "badge ok" : overdue ? "badge warn" : "badge"}>
                        {a.status === "done" ? "Klar" : overdue ? "Förfallen" : "Öppen"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {a.status === "done" ? (
                        <button className="btn" disabled={savingId === a.id} onClick={() => markDone(a.id, false)}>
                          Återöppna
                        </button>
                      ) : (
                        <button className="btn btn-primary" disabled={savingId === a.id} onClick={() => markDone(a.id, true)}>
                          Markera klar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
