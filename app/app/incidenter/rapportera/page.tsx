"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getContext } from "@/lib/app/db";

export default function ReportIncidentPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("Tillbud");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const ctx = await getContext();
      const { error } = await ctx.supabase.from("incidents").insert({
        company_id: ctx.companyId,
        owner_user_id: ctx.userId,
        title: title || "Incident",
        severity,
        description
      });
      if (error) throw error;

      // Create follow-up action
      const due = new Date();
      due.setDate(due.getDate() + 7);
      await ctx.supabase.from("actions").insert({
        company_id: ctx.companyId,
        owner_user_id: ctx.userId,
        title: `Uppföljning: ${title || "Incident"}`,
        description: "Genomför utredning, åtgärder och dokumentera lärdomar.",
        status: "open",
        due_date: due.toISOString().slice(0, 10)
      });

      router.replace("/app/incidenter");
    } catch (e: any) {
      setErr(e?.message || "Något gick fel.");
    }
    setLoading(false);
  }

  return (
    <div className="container">
      <div className="h1">Rapportera incident</div>
      <div className="small" style={{ marginTop: 6 }}>Tillbud ska följas upp. Arbexita skapar en uppföljningsåtgärd automatiskt.</div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
          <div>
            <div className="label">Titel</div>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Tillbud: halkade i köket" />
          </div>
          <div>
            <div className="label">Allvarlighetsgrad</div>
            <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option>Tillbud</option>
              <option>Olycka utan frånvaro</option>
              <option>Olycka med frånvaro</option>
              <option>Allvarlig olycka</option>
            </select>
          </div>
          <div>
            <div className="label">Beskrivning</div>
            <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>

          {err && <div className="small" style={{ color: "#ffb4b4" }}>{err}</div>}
          <button className="btn btn-primary" disabled={loading}>{loading ? "Sparar..." : "Spara incident"}</button>
        </form>
      </div>
    </div>
  );
}
