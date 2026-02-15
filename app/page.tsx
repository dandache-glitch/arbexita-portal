import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function Home() {
  return (
    <div className="container" style={{ paddingBottom: 44 }}>
      <header className="card" style={{ padding: 20, marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div className="brand" style={{ gap: 14 }}>
            <Logo />
            <div>
              <div style={{ fontWeight: 950, letterSpacing: "-0.02em", fontSize: 18 }}>Arbexita</div>
              <div className="small">SAM • Dokumentation • Inspektionspaket</div>
            </div>
          </div>

          <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn" href="/login">Logga in</Link>
            <Link className="btn btn-primary" href="/register">Skapa konto</Link>
          </nav>
        </div>
      </header>

      <main className="card" style={{ padding: 24, marginTop: 14 }}>
        <div className="grid grid-2" style={{ alignItems: "start" }}>
          <div>
            <div className="h1">SAM, dokumentation och uppföljning – på ett ställe</div>
            <p className="small" style={{ marginTop: 10, maxWidth: 740 }}>
              Arbexita hjälper små och medelstora företag att <b>strukturera</b> sitt systematiska arbetsmiljöarbete (SAM)
              och <b>samla dokumentationen</b> som ofta efterfrågas vid inspektion, försäkringsärenden eller intern kontroll.
            </p>

            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <Link className="btn btn-primary" href="/register">Kom igång</Link>
              <Link className="btn" href="/login">Jag har redan konto</Link>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <span className="badge">Policy</span>
              <span className="badge">Riskbedömning</span>
              <span className="badge">Åtgärdsplan</span>
              <span className="badge">Incidentlogg</span>
              <span className="badge">Årlig uppföljning</span>
            </div>

            <div className="notice" style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 900, color: "#ffffff" }}>Tydligt ansvar</div>
              <div className="small" style={{ marginTop: 6 }}>
                Arbexita är ett mjukvaruverktyg. Vi är inte konsulter och vi lämnar inga garantier om regelefterlevnad.
                Arbetsgivaren ansvarar alltid för arbetsmiljöarbetet och för att kraven uppfylls.
              </div>
            </div>
          </div>

          <div className="card soft" style={{ padding: 18 }}>
            <div className="h2">Inspektionspaket (PDF + CSV)</div>
            <div className="small" style={{ marginTop: 6, lineHeight: 1.75 }}>
              • Export med timestamp<br />
              • Sammanställning som PDF<br />
              • Register som CSV: risker, åtgärder, incidenter
            </div>
            <div className="hr" />
            <div className="h2">Abonnemang</div>
            <div className="kpi" style={{ marginTop: 8 }}>499 SEK/mån</div>
            <div className="small">1 företag (ägarkonto). Byggt för snabb start och tydlig uppföljning.</div>
          </div>
        </div>

        <div className="grid grid-3" style={{ marginTop: 18 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="h2">Lätt att göra rätt</div>
            <p className="small">Guidad riskbedömning, tydliga val och automatisk struktur på dokumentationen.</p>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="h2">Spårbarhet</div>
            <p className="small">Allt samlas per företag: vad som gjorts, när det gjordes och vad som återstår.</p>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="h2">Förberedelse</div>
            <p className="small">När någon frågar: exportera paketet och visa upp sammanställning och register.</p>
          </div>
        </div>

        <div className="hr" style={{ marginTop: 18 }} />

        <div className="grid grid-2" style={{ alignItems: "start" }}>
          <div>
            <div className="h2">Vad du dokumenterar i Arbexita</div>
            <ul className="small" style={{ marginTop: 10, lineHeight: 1.9 }}>
              <li>Arbetsmiljöpolicy (skapas och sparas)</li>
              <li>Riskbedömningar (enkelt flöde med tydliga val)</li>
              <li>Åtgärdsplan med deadlines och status</li>
              <li>Incidenter/tillbud med uppföljning</li>
              <li>Årlig uppföljning (markeras och följs)</li>
            </ul>
          </div>
          <div className="notice">
            <div style={{ fontWeight: 900, color: "#ffffff" }}>Snabbstart</div>
            <div className="small" style={{ marginTop: 8, lineHeight: 1.85 }}>
              1) Skapa konto och välj bransch<br />
              2) Lägg till första riskbedömningen<br />
              3) Följ upp åtgärder med deadlines<br />
              4) Skapa policy<br />
              5) Ladda ner inspektionspaket
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="btn btn-primary" href="/register">Skapa konto</Link>
              <Link className="btn" href="/login">Logga in</Link>
            </div>
          </div>
        </div>

        <footer className="small" style={{ marginTop: 16, opacity: 0.9 }}>
          Arbexita är ett verktyg för struktur och dokumentation i SAM. Vi lämnar inga garantier och ger inte juridisk
          rådgivning.
        </footer>
      </main>
    </div>
  );
}
