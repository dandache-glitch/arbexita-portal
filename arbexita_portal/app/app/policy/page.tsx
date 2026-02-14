"use client";
import { useState } from "react";

export default function PolicyPage() {
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [employees, setEmployees] = useState(1);
  const [responsible, setResponsible] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/policy/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ companyName, industry, employees, responsible })
    });
    setLoading(false);
    if (!res.ok) {
      alert("Kunde inte generera policy. Kontrollera att du är inloggad och att Supabase är konfigurerat.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="h1">Arbetsmiljöpolicy</div>
      <p className="small">Fyll i uppgifter och generera en policy-PDF. Spara den i Dokument efter generation (i nästa steg kan vi auto-spara i storage).</p>

      <div className="card p-6 space-y-4">
        <div>
          <div className="label">Företagsnamn</div>
          <input className="input" value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="Ex. AB Exempel" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="label">Bransch</div>
            <input className="input" value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="Ex. IT, bygg, lager..." />
          </div>
          <div>
            <div className="label">Antal anställda</div>
            <input className="input" type="number" min={1} value={employees} onChange={e=>setEmployees(parseInt(e.target.value||"1",10))} />
          </div>
        </div>
        <div>
          <div className="label">Ansvarig (arbetsmiljö)</div>
          <input className="input" value={responsible} onChange={e=>setResponsible(e.target.value)} placeholder="Namn" />
        </div>
        <button className="btn btn-primary" onClick={generate} disabled={loading}>
          {loading ? "Genererar..." : "Generera policy (PDF)"}
        </button>
      </div>
    </div>
  );
}
