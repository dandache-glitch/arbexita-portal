"use client";

import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Notice } from "@/components/ui/Notice";

export default function ExportPackPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function downloadPack() {
    setError(null);
    setOk(null);
    setBusy(true);

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setBusy(false);
      setError("Du är inte inloggad.");
      return;
    }

    try {
      const res = await fetch("/api/export/pack", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Export misslyckades (${res.status})`);
      }

      const blob = await res.blob();
      const cd = res.headers.get("content-disposition") || "";
      const match = /filename=([^;]+)/i.exec(cd);
      const filename = match ? match[1].replace(/\"/g, "") : "Arbexita_Inspektionspaket.zip";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setOk("Inspektionspaket nedladdat.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Okänt fel");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <PageHeader
        title="Inspektionspaket"
        subtitle={
          <>
            Ladda ner en sammanställning (PDF) och register (CSV) med timestamp. Perfekt vid frågor från myndighet,
            försäkring eller intern revision.
          </>
        }
      />

      <div className="card" style={{ padding: 16, marginTop: 14, maxWidth: 900 }}>
        {error ? <Notice tone="error">{error}</Notice> : null}
        {ok ? (
          <div style={{ marginTop: 12 }}>
            <Notice tone="success">{ok}</Notice>
          </div>
        ) : null}

        <div className="grid" style={{ marginTop: 12 }}>
          <div className="notice">
            <b>Innehåll</b>
            <div className="small" style={{ marginTop: 6, lineHeight: 1.7 }}>
              • PDF: sammanställning + checklista (indikativ)<br />
              • PDF: arbetsmiljöpolicy (standardmall / senaste metadata)<br />
              • CSV: riskbedömningar, åtgärder, incidenter<br />
              • Filnamn med timestamp
            </div>
          </div>

          <button className="btn btn-primary" onClick={downloadPack} disabled={busy}>
            {busy ? "Skapar paket…" : "Ladda ner inspektionspaket (.zip)"}
          </button>

          <div className="small" style={{ opacity: 0.9 }}>
            Obs: Arbexita ger inte juridisk rådgivning. Paketet hjälper er att samla och presentera dokumentationen.
          </div>
        </div>
      </div>
    </div>
  );
}
