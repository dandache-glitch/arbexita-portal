import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function Home() {
  return (
    <div className="container">
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div className="brand">
            <Logo />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn" href="/login">Logga in</Link>
            <Link className="btn btn-primary" href="/register">Skapa konto</Link>
          </div>
        </div>

        <div className="hr" />

        <div className="grid grid-2" style={{ alignItems: "start" }}>
          <div>
            <div className="h1">SAM-portal som gör dig inspektionsredo</div>
            <p className="small" style={{ marginTop: 10, maxWidth: 700 }}>
              Arbexita hjälper små och medelstora företag i Sverige att uppfylla kraven i Systematiskt Arbetsmiljöarbete
              (SAM) – med en tydlig compliance-score, checklistor och dokumentation som är redo när Arbetsmiljöverket
              knackar på.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <Link className="btn btn-primary" href="/register">Kom igång på 2 minuter</Link>
              <Link className="btn" href="/login">Jag har redan konto</Link>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <span className="badge ok">Compliance-score 0–100%</span>
              <span className="badge">Policy PDF</span>
              <span className="badge">Risk → Åtgärd automatiskt</span>
            </div>
          </div>

          <div className="card soft" style={{ padding: 18 }}>
            <div className="h2">Pris</div>
            <div className="kpi" style={{ marginTop: 8 }}>499 SEK/mån</div>
            <div className="small">För 1 företag (ägarkonto). Inkluderar policy, risker, åtgärder och incidenter.</div>
            <div className="hr" />
            <div className="small">
              • Tydlig “Redo för inspektion”-checklista<br />
              • Branschstöd och dokumentpaket<br />
              • Export/PDF för dokumentation
            </div>
          </div>
        </div>

        <div className="grid grid-3" style={{ marginTop: 18 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="h2">Redo för inspektion</div>
            <p className="small">En tydlig checklista som låser upp 100% compliance steg för steg.</p>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="h2">Styrning & spårbarhet</div>
            <p className="small">Risknivåer, deadlines och status gör att du alltid kan visa vad som gjorts.</p>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="h2">Snabb onboarding</div>
            <p className="small">Skapa konto, välj bransch och börja dokumentera direkt – utan konsulttimme.</p>
          </div>
        </div>

        <div className="small" style={{ marginTop: 16 }}>
          Arbexita är ett verktyg för struktur och dokumentation. För juridisk rådgivning, rådgör med sakkunnig.
        </div>
      </div>
    </div>
  );
}
