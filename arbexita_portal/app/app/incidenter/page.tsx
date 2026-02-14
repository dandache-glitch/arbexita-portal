import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getMyCompany } from "@/lib/data";

export default async function IncidentsPage() {
  const company = await getMyCompany();
  if (!company) return null;
  const supabase = supabaseServer();
  const { data: incidents } = await supabase
    .from("incidents")
    .select("*")
    .eq("company_id", company.id)
    .order("occurred_at", { ascending: false });

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="h1">Incidenter</div>
          <div className="small">Rapportera olyckor och tillbud. Detta bygger spårbar dokumentation.</div>
        </div>
        <Link className="btn btn-primary" href="/app/incidenter/rapportera">Rapportera incident</Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-3">Datum</th>
              <th className="text-left p-3">Typ</th>
              <th className="text-left p-3">Område</th>
              <th className="text-left p-3">Plats</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(incidents ?? []).map(i => (
              <tr key={i.id} className="border-b border-slate-100">
                <td className="p-3">{new Date(i.occurred_at).toLocaleString("sv-SE")}</td>
                <td className="p-3">{i.type}</td>
                <td className="p-3">{i.area}</td>
                <td className="p-3">{i.place ?? "-"}</td>
                <td className="p-3">{i.status}</td>
              </tr>
            ))}
            {(incidents ?? []).length === 0 && (
              <tr><td className="p-5 small" colSpan={5}>Inga incidenter ännu.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
