import Link from "next/link";

export default function Home() {
  return (
    <div className="container">
      <div className="card" style={{ padding: 28 }}>
        <div className="h1">Arbexita</div>
        <p className="small" style={{ marginTop: 8, maxWidth: 780 }}>
          En beroendeframkallande SAM-portal som hjälper företag nå <b>100% “Redo för inspektion”</b>.
          Riskbedömningar, åtgärder, incidenter och policy – allt på ett ställe.
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" href="/register">Skapa konto</Link>
          <Link className="btn" href="/login">Logga in</Link>
        </div>

        <div className="grid grid-3" style={{ marginTop: 22 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="h2">“Redo för inspektion”</div>
            <p className="small">Få en tydlig checklista som guidar dig till 100% compliance.</p>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="h2">Autoprioritering</div>
            <p className="small">Höga risker skapar automatiskt åtgärder med deadline och ansvar.</p>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="h2">Branschpaket</div>
            <p className="small">Välj bransch och få rätt formulär & PDF-mallar direkt i dashboarden.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
