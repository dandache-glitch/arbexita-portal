"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getContext, riskLevel } from "@/lib/app/db";

const AREAS = [
  "Fysiska risker",
  "Ergonomi/belastning",
  "Psykosocial arbetsmiljö",
  "Kemiska risker",
  "Maskiner/verktyg",
  "Brand/utrymning",
  "Övrigt"
];

export default function NewRiskPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [area, setArea] = useState(AREAS[0]);
  const [probability, setProbability] = useState(3);
  const [consequence, setConsequence] = useState(3);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const level = riskLevel(probability, consequence);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const ctx = await getContext();

      const { data: risk, error } = await ctx.supabase.from("risks").insert({
        company_id: ctx.companyId,
        owner_user_id: ctx.userId,
        title: title || "Risk",
        area,
        probability,
        consequence,
        level,
        status: "open",
        notes
      }).select("id").single();

      if (error) throw error;

      // Auto-create action for high risk
      if (level >= 9) {
        const due = new Date();
        due.setDate(due.getDate() + 14);
        await ctx.supabase.from("actions").insert({
          company_id: ctx.companyId,
          owner_user_id: ctx.userId,
          title: `Åtgärd: ${title || "Hög risk"} (nivå ${level})`,
          description: "Föreslå och genomför riskreducerande åtgärder. Dokumentera vad som görs och följ upp.",
          status: "open",
          due_date: due.toISOString().slice(0, 10)
        });
      }

      router.replace("/app/riskbedomningar");
    } catch (e: any) {
      setErr(e?.message || "Något gick fel.");
    }
    setLoading(false);
  }

  function badgeForLevel(l: number) {
    if (l >= 15) return <span className="badge danger">Mycket hög</span>;
    if (l >= 9) return <span className="badge warn">Hög</span>;
    if (l >= 4) return <span className="badge">Mellan</span>;
    return <span className="badge ok">Låg</span>;
  }

  return (
    <div className="container">
      <div className="h1">Ny riskbedömning</div>
      <div className="small" style={{ marginTop: 6 }}>
        Bedöm sannolikhet och konsekvens (1–5). Risknivå = S × K. Höga risker skapar automatiskt åtgärder.
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
          <div>
            <div className="label">Titel</div>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Halkrisk vid entrén" />
          </div>

          <div className="grid grid-2">
            <div>
              <div className="label">Område</div>
              <select className="input" value={area} onChange={(e) => setArea(e.target.value)}>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <div className="label">Noteringar</div>
              <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Kort beskrivning / observationer" />
            </div>
          </div>

          <div className="grid grid-2">
            <div>
              <div className="label">Sannolikhet (1–5)</div>
              <input className="input" type="number" min={1} max={5} value={probability} onChange={(e) => setProbability(Number(e.target.value))} />
            </div>
            <div>
              <div className="label">Konsekvens (1–5)</div>
              <input className="input" type="number" min={1} max={5} value={consequence} onChange={(e) => setConsequence(Number(e.target.value))} />
            </div>
          </div>

          <div className="card" style={{ padding: 12, borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="small">Risknivå: <b>{level}</b></div>
              {badgeForLevel(level)}
            </div>
            <div className="small" style={{ marginTop: 6 }}>
              Rekommendation: {level >= 9 ? "Skapa åtgärdsplan och sätt deadline." : "Följ upp vid behov."}
            </div>
          </div>

          {err && <div className="small" style={{ color: "#ffb4b4" }}>{err}</div>}

          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Sparar..." : "Spara riskbedömning"}
          </button>
        </form>
      </div>
    </div>
  );
}
