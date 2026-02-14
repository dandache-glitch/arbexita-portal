import Link from "next/link";

export default async function DocumentsPage() {
  return (
    <div className="space-y-5">
      <div>
        <div className="h1">Dokument & uppföljning</div>
        <div className="small">Här samlar ni allt för inspektion: policy, riskbedömningar, åtgärder och incidenter.</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <div className="h2">Arbetsmiljöpolicy</div>
          <p className="small mt-2">Generera uppdaterad policy som PDF.</p>
          <div className="mt-4">
            <Link className="btn btn-primary" href="/app/policy">Öppna policy-generator</Link>
          </div>
        </div>

        <div className="card p-6">
          <div className="h2">Export</div>
          <p className="small mt-2">I MVP finns export för policy och risk-detalj. Nästa steg är “Exportera allt” (zip).</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="btn" href="/app/riskbedomningar">Exportera risk (via risk-sida)</Link>
            <Link className="btn" href="/app/incidenter">Exportera incidenter (kommer nästa)</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
