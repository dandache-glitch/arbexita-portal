import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getMyCompany } from "@/lib/data";

export default async function RiskDetailPage({ params }: { params: { id: string }}) {
  const company = await getMyCompany();
  if (!company) return null;

  const supabase = supabaseServer();
  const { data: risk } = await supabase
    .from("risks")
    .select("*")
    .eq("id", params.id)
    .eq("company_id", company.id)
    .maybeSingle();

  if (!risk) {
    return (
      <div className="card p-6">
        <div className="h2">Risk hittades inte</div>
        <Link className="underline" href="/app/riskbedomningar">Tillbaka</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-end justify-between">
        <div>
          <div className="h1">{risk.title}</div>
          <div className="small">{risk.area} • Risknivå {risk.risk_level}</div>
        </div>
        <Link className="btn" href="/app/riskbedomningar">Tillbaka</Link>
      </div>

      <div className="card p-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><div className="label">Sannolikhet</div><div className="text-lg font-semibold">{risk.probability}</div></div>
          <div><div className="label">Konsekvens</div><div className="text-lg font-semibold">{risk.consequence}</div></div>
          <div><div className="label">Ansvarig</div><div className="text-lg font-semibold">{risk.responsible ?? "-"}</div></div>
          <div><div className="label">Deadline</div><div className="text-lg font-semibold">{risk.deadline ?? "-"}</div></div>
        </div>
        <div><div className="label">Status</div><div className="text-lg font-semibold">{risk.status}</div></div>
        <div className="pt-3 flex gap-2">
          <Link className="btn btn-primary" href={`/app/atgarder?risk=${risk.id}`}>Se kopplade åtgärder</Link>
          <Link className="btn" href={`/app/dokument?export=risk&id=${risk.id}`}>Exportera PDF</Link>
        </div>
      </div>
    </div>
  );
}
