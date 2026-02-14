import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getMyCompany } from "@/lib/data";

export default async function ActionsPage({ searchParams }: { searchParams: { risk?: string }}) {
  const company = await getMyCompany();
  if (!company) return null;

  const supabase = supabaseServer();
  let q = supabase.from("actions").select("*").eq("company_id", company.id).order("created_at", { ascending: false });
  if (searchParams.risk) q = q.eq("linked_risk_id", searchParams.risk);
  const { data: actions } = await q;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="h1">Åtgärder</div>
          <div className="small">Åtgärdsplaner kopplade till risker och incidenter.</div>
        </div>
        <Link className="btn btn-primary" href="/app/atgarder/ny">Ny åtgärd</Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-3">Titel</th>
              <th className="text-left p-3">Ansvarig</th>
              <th className="text-left p-3">Deadline</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(actions ?? []).map(a => (
              <tr key={a.id} className="border-b border-slate-100">
                <td className="p-3">{a.title}</td>
                <td className="p-3">{a.responsible ?? "-"}</td>
                <td className="p-3">{a.deadline ?? "-"}</td>
                <td className="p-3">{a.status}</td>
              </tr>
            ))}
            {(actions ?? []).length === 0 && (
              <tr><td className="p-5 small" colSpan={4}>Inga åtgärder ännu.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
