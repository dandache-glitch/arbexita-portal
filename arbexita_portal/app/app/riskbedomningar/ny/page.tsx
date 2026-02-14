"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NewRiskPage() {
  const [area, setArea] = useState("Kontor");
  const [title, setTitle] = useState("Ergonomi (ställning/arbete vid dator)");
  const [prob, setProb] = useState(2);
  const [cons, setCons] = useState(3);
  const [responsible, setResponsible] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const router = useRouter();

  const riskLevel = prob * cons;

  async function loadCompanyId(): Promise<string> {
    const supabase = supabaseBrowser();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not logged in");

    const { data: company, error } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_user_id", userData.user.id)
      .maybeSingle();
    if (error || !company) throw new Error(error?.message ?? "No company");
    return company.id;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = supabaseBrowser();
      const companyId = await loadCompanyId();

      const { data, error } = await supabase.from("risks").insert({
        company_id: companyId,
        area,
        title,
        probability: prob,
        consequence: cons,
        risk_level: riskLevel,
        responsible: responsible || null,
        deadline: deadline || null,
        status: "open"
      }).select("id").single();

      if (error) throw error;

      // Auto create action if risk level high
      if (riskLevel >= 9) {
        await supabase.from("actions").insert({
          company_id: companyId,
          title: `Åtgärd för risk: ${title}`,
          description: "Skapa åtgärd, tilldela ansvarig och deadline.",
          responsible: responsible || null,
          deadline: deadline || null,
          status: "todo",
          linked_risk_id: data.id
        });
      }

      router.push("/app/riskbedomningar");
    } catch (e: any) {
      setError(e.message ?? "Fel");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="h1">Ny riskbedömning</div>
      <p className="small mt-2">Fyll i risk. Risknivå beräknas automatiskt (S×K).</p>

      <form className="card p-6 mt-5 space-y-4" onSubmit={onSubmit}>
        <div>
          <div className="label">Område</div>
          <select className="input" value={area} onChange={e=>setArea(e.target.value)}>
            <option>Kontor</option>
            <option>Lager</option>
            <option>Byggarbetsplats</option>
            <option>Verkstad</option>
            <option>Transport</option>
            <option>Psykosocialt (stress/arbetsbelastning)</option>
          </select>
        </div>

        <div>
          <div className="label">Risk (rubrik)</div>
          <input className="input" value={title} onChange={e=>setTitle(e.target.value)} required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="label">Sannolikhet (1–5)</div>
            <input className="input" type="number" min={1} max={5} value={prob} onChange={e=>setProb(parseInt(e.target.value,10))} />
          </div>
          <div>
            <div className="label">Konsekvens (1–5)</div>
            <input className="input" type="number" min={1} max={5} value={cons} onChange={e=>setCons(parseInt(e.target.value,10))} />
          </div>
        </div>

        <div className="card p-4 bg-slate-50 border-slate-200">
          <div className="small">Beräknad risknivå</div>
          <div className="text-3xl font-semibold">{riskLevel}</div>
          <div className="small">9+ skapar automatiskt en åtgärd i Åtgärdsplanen.</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="label">Ansvarig</div>
            <input className="input" value={responsible} onChange={e=>setResponsible(e.target.value)} placeholder="Namn" />
          </div>
          <div>
            <div className="label">Deadline</div>
            <input className="input" value={deadline} onChange={e=>setDeadline(e.target.value)} type="date" />
          </div>
        </div>

        {error && <div className="text-sm text-red-700">{error}</div>}
        <button className="btn btn-primary" disabled={loading}>{loading ? "Sparar..." : "Spara riskbedömning"}</button>
      </form>
    </div>
  );
}
