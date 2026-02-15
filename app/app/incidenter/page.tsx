"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useCompany } from "@/app/providers/CompanyProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { Notice } from "@/components/ui/Notice";

type IncidentRow = {
  id: string;
  title: string;
  severity: string;
  description: string | null;
  created_at: string;
};

export default function IncidentsPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const company = useCompany();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<IncidentRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!company.companyId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("incidents")
        .select("id,title,severity,description,created_at")
        .eq("company_id", company.companyId)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        setError(error.message);
        setRows([]);
        setLoading(false);
        return;
      }

      setRows(((data as any[]) ?? []) as IncidentRow[]);
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [company.companyId, supabase]);

  return (
    <div className="container">
      <PageHeader
        title="Incidenter"
        subtitle={<>Rapportera tillbud/olyckor och säkerställ uppföljning.</>}
        right={
          <>
            <Link className="btn" href="/app">Dashboard</Link>
            <Link className="btn btn-primary" href="/app/incidenter/rapportera">Rapportera incident</Link>
          </>
        }
      />

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        {error ? <Notice tone="error">{error}</Notice> : null}

        <table className="table" style={{ marginTop: error ? 12 : 0 }}>
          <thead>
            <tr>
              <th>Titel</th>
              <th>Typ</th>
              <th>Datum</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="small">Laddar…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={3} className="small">Inga incidenter ännu.</td></tr>
            ) : (
              rows.map((i) => (
                <tr key={i.id}>
                  <td>
                    <div style={{ fontWeight: 800 }}>{i.title}</div>
                    {i.description ? <div className="small" style={{ marginTop: 2 }}>{i.description}</div> : null}
                  </td>
                  <td><span className="badge">{i.severity}</span></td>
                  <td className="small">{new Date(i.created_at).toLocaleDateString("sv-SE")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
