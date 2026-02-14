"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ReportIncidentPage() {
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0,16));
  const [type, setType] = useState("Tillbud");
  const [area, setArea] = useState("Kontor");
  const [place, setPlace] = useState("");
  const [description, setDescription] = useState("");
  const [immediateAction, setImmediateAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const router = useRouter();

  async function loadCompanyId(): Promise<string> {
    const supabase = supabaseBrowser();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not logged in");
    const { data: company, error } = await supabase.from("companies").select("id").eq("owner_user_id", userData.user.id).maybeSingle();
    if (error || !company) throw new Error(error?.message ?? "No company");
    return company.id;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const supabase = supabaseBrowser();
      const companyId = await loadCompanyId();
      const { data, error } = await supabase.from("incidents").insert({
        company_id: companyId,
        occurred_at: new Date(occurredAt).toISOString(),
        type,
        area,
        place: place || null,
        description,
        immediate_action: immediateAction || null,
        status: "reported"
      }).select("id").single();
      if (error) throw error;

      // Auto create follow-up action
      await supabase.from("actions").insert({
        company_id: companyId,
        title: `Uppföljning incident (${type})`,
        description: "Gör orsaksanalys och förebyggande åtgärd. Dokumentera i Arbexita.",
        status: "todo",
        linked_incident_id: data.id
      });

      router.push("/app/incidenter");
    } catch (e:any) {
      setError(e.message ?? "Fel");
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-3xl">
      <div className="h1">Rapportera incident</div>
      <p className="small mt-2">Snabb registrering av olycka/tillbud. Skapar automatiskt en uppföljningsåtgärd.</p>

      <form className="card p-6 mt-5 space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="label">Datum & tid</div>
            <input className="input" type="datetime-local" value={occurredAt} onChange={e=>setOccurredAt(e.target.value)} />
          </div>
          <div>
            <div className="label">Incidenttyp</div>
            <select className="input" value={type} onChange={e=>setType(e.target.value)}>
              <option>Olycka</option>
              <option>Tillbud</option>
              <option>Nära ögat</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="label">Område</div>
            <select className="input" value={area} onChange={e=>setArea(e.target.value)}>
              <option>Kontor</option>
              <option>Lager</option>
              <option>Byggarbetsplats</option>
              <option>Verkstad</option>
              <option>Transport</option>
              <option>Psykosocialt</option>
            </select>
          </div>
          <div>
            <div className="label">Plats</div>
            <input className="input" value={place} onChange={e=>setPlace(e.target.value)} placeholder="Ex. maskinavdelning" />
          </div>
        </div>

        <div>
          <div className="label">Beskrivning</div>
          <textarea className="input" rows={5} value={description} onChange={e=>setDescription(e.target.value)} required />
        </div>

        <div>
          <div className="label">Omedelbara åtgärder</div>
          <textarea className="input" rows={3} value={immediateAction} onChange={e=>setImmediateAction(e.target.value)} />
        </div>

        {error && <div className="text-sm text-red-700">{error}</div>}
        <div className="flex gap-2">
          <button className="btn btn-danger" type="button" onClick={()=>router.back()}>Avbryt</button>
          <button className="btn btn-primary" disabled={loading}>{loading ? "Rapporterar..." : "Rapportera incident"}</button>
        </div>
      </form>
    </div>
  );
}
