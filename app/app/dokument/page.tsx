"use client";

import Link from "next/link";
import { INDUSTRIES } from "@/lib/app/industries";
import { useCompany } from "@/app/providers/CompanyProvider";
import { PageHeader } from "@/components/ui/PageHeader";

export default function DocumentsPage() {
  const company = useCompany();
  const pack = INDUSTRIES.find((x) => x.key === company.industry) || INDUSTRIES[0];

  return (
    <div className="container">
      <PageHeader
        title="Branschdokument"
        subtitle={
          <>
            Förvalda dokument och checklistor för <b>{pack.name}</b>. Använd dem som underlag för riskbedömningar och åtgärder.
          </>
        }
        right={<Link className="btn" href="/app">Dashboard</Link>}
      />

      <div className="grid grid-2" style={{ marginTop: 14 }}>
        {pack.docs.map((d) => (
          <div className="card" style={{ padding: 16 }} key={d.slug}>
            <div className="h2">{d.title}</div>
            <div className="small" style={{ marginTop: 6 }}>{d.description}</div>
            <div className="hr" />
            <div className="small">
              Pro-tip: När du fyllt i checklistan – skapa en åtgärd för varje punkt som behöver förbättras.
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link className="btn" href="/app/riskbedomningar/ny">Ny risk</Link>
              <Link className="btn" href="/app/atgarder/ny">Ny åtgärd</Link>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div className="h2">Snabb väg till 100%</div>
        <div className="small" style={{ marginTop: 6 }}>
          1) Gör en riskbedömning → 2) Säkerställ att åtgärder har deadline → 3) Rapportera incidenter → 4) Generera policy PDF → 5) Markera årlig uppföljning.
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" href="/app/compliance">Öppna checklistan</Link>
          <Link className="btn" href="/app/policy">Skapa policy</Link>
        </div>
      </div>
    </div>
  );
}
