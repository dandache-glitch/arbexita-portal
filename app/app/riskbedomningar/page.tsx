"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useCompany } from "@/app/providers/CompanyProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { riskTone } from "@/lib/app/risk";

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

export default function RisksPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const company = useCompany();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RiskRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!company.companyId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("risks")
        .select("id,title,area,probability,consequence,level,status,created_at")
        .eq("company_id", company.companyId)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        setError(error.message);
        setRows([]);
        setLoading(false);
        return;
      }

      setRows((data as any[]) as RiskRow[]);
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
        title="Riskbedömningar"
        subtitle={<>Dokumentera risker enligt SAM. Risknivå = sannolikhet × konsekvens.</>}
        right={
          <>
            <Link className="btn" href="/app">Dashboard</Link>
            <Link className="btn btn-primary" href="/app/riskbedomningar/ny">Ny riskbedömning</Link>
          </>
        }
      />

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        {error ? <div className="notice error">{error}</div> : null}

        <table className="table" style={{ marginTop: error ? 12 : 0 }}>
          <thead>
            <tr>
              <th>Titel</th>
              <th>Område</th>
              <th>Risknivå</th>
              <th>Status</th>
              <th>Datum</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="small">Laddar…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="small">Inga risker ännu. Skapa din första riskbedömning.</td></tr>
            ) : (
              rows.map((r) => {
                const tone = riskTone(r.level);
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 750 }}>{r.title}</td>
                    <td>{r.area}</td>
                    <td>
                      <span className={`badge ${tone}`}>{r.level}</span>
                    </td>
                    <td>{r.status}</td>
                    <td className="small">{new Date(r.created_at).toLocaleDateString("sv-SE")}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="small" style={{ marginTop: 14 }}>
        Tips: Risknivå ≥ 9 bör alltid leda till en åtgärd med deadline.
      </div>
    </div>
  );
}
