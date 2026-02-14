import Link from "next/link";
import { getMyCompany } from "@/lib/data";
import { supabaseServer } from "@/lib/supabase/server";

export default async function RisksPage() {
  const company = await getMyCompany();
  if (!company) return null;

  const supabase = supabaseServer();
  const { data: risks } = await supabase
    .from("risks")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="h1">Riskbedömningar</div>
          <div className="small">Skapa och följ upp risker. Risknivå = sannolikhet × konsekvens.</div>
        </div>
        <Link className="btn btn-primary" href="/app/riskbedomningar/ny">Ny riskbedömning</Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-3">Område</th>
              <th className="text-left p-3">Risk</th>
              <th className="text-left p-3">Risknivå</th>
              <th className="text-left p-3">Ansvarig</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3"> </th>
            </tr>
          </thead>
          <tbody>
            {(risks ?? []).map(r => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="p-3">{r.area}</td>
                <td className="p-3">{r.title}</td>
                <td className="p-3">
                  <span className="badge border-slate-200">{r.risk_level}</span>
                </td>
                <td className="p-3">{r.responsible ?? "-"}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3 text-right">
                  <Link className="underline" href={`/app/riskbedomningar/${r.id}`}>Öppna</Link>
                </td>
              </tr>
            ))}
            {(risks ?? []).length === 0 && (
              <tr><td className="p-5 small" colSpan={6}>Inga riskbedömningar ännu. Skapa din första.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
