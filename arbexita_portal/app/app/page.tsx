import Link from "next/link";
import { ProgressGauge } from "@/components/ProgressGauge";
import { StatCard } from "@/components/StatCard";
import { getDashboardStats, getMyCompany } from "@/lib/data";

export default async function DashboardPage() {
  const company = await getMyCompany();
  if (!company) {
    return (
      <div className="card p-6">
        <div className="h2">Ingen organisation hittades</div>
        <p className="small mt-2">Gå tillbaka och skapa konto igen.</p>
      </div>
    );
  }

  const stats = await getDashboardStats(company.id);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="h1">Dashboard</div>
          <div className="small">Välkommen, {company.name}. Här är er SAM-status.</div>
        </div>
        <div className="flex gap-2">
          <Link className="btn" href="/app/policy">Skapa/uppdatera policy</Link>
          <Link className="btn btn-primary" href="/app/riskbedomningar/ny">Ny riskbedömning</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ProgressGauge value={stats.score} />
        <div className="grid grid-cols-1 gap-4">
          <StatCard label="Aktiva risker" value={stats.openRisks} />
          <StatCard label="Pågående åtgärder" value={stats.openActions} />
          <StatCard label="Rapporterade incidenter" value={stats.incidentCount} />
        </div>
        <div className="card p-5">
          <div className="h2">Nästa steg</div>
          <ul className="mt-3 space-y-2 text-sm">
            {!stats.hasPolicy && <li>• Skapa arbetsmiljöpolicy (obligatoriskt)</li>}
            {stats.openRisks > 0 && <li>• Stäng öppna risker eller koppla åtgärder</li>}
            {stats.openActions > 0 && <li>• Slutför åtgärder som har deadline</li>}
            <li>• Planera årlig uppföljning (årsgenomgång)</li>
          </ul>
          <div className="mt-4 flex gap-2">
            <Link className="btn" href="/app/dokument">Öppna dokumentmapp</Link>
            <Link className="btn" href="/app/incidenter/rapportera">Rapportera incident</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="h2">Snabbåtgärder</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link className="btn btn-primary" href="/app/riskbedomningar">Visa riskbedömningar</Link>
            <Link className="btn" href="/app/atgarder">Visa åtgärder</Link>
            <Link className="btn" href="/app/incidenter">Visa incidenter</Link>
          </div>
        </div>

        <div className="card p-5">
          <div className="h2">Kommande uppgifter</div>
          <p className="small mt-2">I MVP är detta en enkel lista. Sen kan du koppla kalenderintegration.</p>
          <ul className="mt-3 text-sm space-y-2">
            <li>• Skyddsrond (rekommenderat: månadsvis/kvartalsvis)</li>
            <li>• Riskmöte (rekommenderat: kvartalsvis)</li>
            <li>• Årsgenomgång (obligatoriskt uppföljningsmoment)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
