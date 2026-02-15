"use client";

import { useEffect, useMemo, useState } from "react";
import { INDUSTRIES } from "@/lib/app/industries";
import { getContext } from "@/lib/app/db";

export default function DocumentsPage() {
  const [industry, setIndustry] = useState<string>("kontor");
  const [companyName, setCompanyName] = useState<string>("Företaget");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const ctx = await getContext();
      setIndustry(ctx.industry);
      setCompanyName(ctx.companyName);
      setLoading(false);
    }
    load();
  }, []);

  const pack = INDUSTRIES.find(x => x.key === industry) || INDUSTRIES[0];

  return (
    <div className="container">
      <div className="h1">Branschdokument</div>
      <div className="small" style={{ marginTop: 6 }}>
        Förvalda dokument och checklistor för <b>{pack.name}</b>. (Säljargument: “rätt mallar direkt”.)
      </div>

      <div className="grid grid-2" style={{ marginTop: 14 }}>
        {pack.docs.map(d => (
          <div className="card" style={{ padding: 16 }} key={d.slug}>
            <div className="h2">{d.title}</div>
            <div className="small" style={{ marginTop: 6 }}>{d.description}</div>
            <div className="small" style={{ marginTop: 8 }}>
              Pro-tip: När du fyllt i checklistan – skapa en åtgärd för varje “nej”.
            </div>
          </div>
        ))}
      </div>

      {loading ? null : (
        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div className="h2">Snabbt uppåt mot 100%</div>
          <div className="small" style={{ marginTop: 6 }}>
            1) Gör en riskbedömning → 2) Skapa åtgärder → 3) Markera åtgärder klara → 4) Generera policy PDF → 5) Markera årlig uppföljning.
          </div>
        </div>
      )}
    </div>
  );
}
