"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/app/providers/AuthProvider";
import { useCompany } from "@/app/providers/CompanyProvider";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  CONSEQUENCE_OPTIONS,
  LIKELIHOOD_OPTIONS,
  riskLabel,
  riskLevel,
  riskTone,
} from "@/lib/app/risk";

type Step = 1 | 2 | 3;

function CardOption({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="optionCard"
      data-active={active ? "1" : "0"}
      onClick={onClick}
    >
      <div style={{ fontWeight: 850 }}>{title}</div>
      <div className="small" style={{ marginTop: 4 }}>
        {subtitle}
      </div>
    </button>
  );
}

export default function NewRiskPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const { user } = useAuth();
  const company = useCompany();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);

  const [title, setTitle] = useState("");
  const [area, setArea] = useState("Arbetsplats");
  const [probability, setProbability] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [consequence, setConsequence] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const level = riskLevel(probability, consequence);
  const tone = riskTone(level);
  const label = riskLabel(level);

  const highRisk = level >= 9;

  async function onSubmit() {
    setError(null);

    if (!user || !company.companyId) {
      setError("Inte inloggad.");
      return;
    }

    if (!title.trim()) {
      setError("Skriv en kort titel för risken.");
      setStep(1);
      return;
    }

    setSaving(true);

    const { error: riskErr } = await supabase.from("risks").insert({
      company_id: company.companyId,
      owner_user_id: user.id,
      title: title.trim(),
      area: area.trim(),
      probability,
      consequence,
      level,
      status: "open",
      notes: notes.trim() || null,
    });

    setSaving(false);

    if (riskErr) {
      setError(riskErr.message);
      return;
    }

    // DB-trigger skapar åtgärd automatiskt för hög risk (om schema har trigger).
    router.replace("/app/riskbedomningar");
  }

  return (
    <div className="container">
      <PageHeader
        title="Ny riskbedömning"
        subtitle={
          <>
            Enkelt, tydligt och dokumenterat. Välj hur ofta risken kan inträffa och hur allvarlig den blir.
          </>
        }
        right={<Link className="btn" href="/app/riskbedomningar">Till risklistan</Link>}
      />

      <div className="card" style={{ padding: 18, marginTop: 14, maxWidth: 980 }}>
        {error ? <Notice tone="error">{error}</Notice> : null}

        <div className="stepper" style={{ marginTop: error ? 12 : 0 }}>
          <div className={`step ${step === 1 ? "active" : step > 1 ? "done" : ""}`}>1. Risk</div>
          <div className={`step ${step === 2 ? "active" : step > 2 ? "done" : ""}`}>2. Hur ofta?</div>
          <div className={`step ${step === 3 ? "active" : ""}`}>3. Hur allvarligt?</div>
        </div>

        <div className="hr" />

        {step === 1 ? (
          <div className="grid" style={{ gap: 12 }}>
            <div>
              <div className="label">Titel (kort och tydlig)</div>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Halkrisk vid entré"
                autoFocus
              />
              <div className="small" style={{ marginTop: 6 }}>
                Tips: Skriv vad som kan hända och var.
              </div>
            </div>

            <div className="grid grid-2">
              <div>
                <div className="label">Område</div>
                <input className="input" value={area} onChange={(e) => setArea(e.target.value)} />
              </div>
              <div>
                <div className="label">Risknivå (indikator)</div>
                <div className="notice" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>{label}</div>
                    <div className="small">Baserat på dina val i steg 2–3.</div>
                  </div>
                  <span className={`badge ${tone}`}>Nivå {level}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
              <button className="btn btn-primary" type="button" onClick={() => setStep(2)} disabled={!title.trim()}>
                Nästa
              </button>
              <Link className="btn" href="/app/riskbedomningar">Avbryt</Link>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid" style={{ gap: 12 }}>
            <div>
              <div className="h2">Hur ofta kan detta inträffa?</div>
              <div className="small" style={{ marginTop: 6 }}>
                Välj det alternativ som bäst matchar verkligheten. Du kan alltid justera senare.
              </div>
            </div>

            <div className="optionsGrid">
              {LIKELIHOOD_OPTIONS.map((o) => (
                <CardOption
                  key={o.value}
                  active={probability === o.value}
                  title={`${o.label}`}
                  subtitle={o.example}
                  onClick={() => setProbability(o.value)}
                />
              ))}
            </div>

            <div className="notice" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 850 }}>Nuvarande: {LIKELIHOOD_OPTIONS.find((x) => x.value === probability)?.label}</div>
                <div className="small">Sannolikhet = {probability} (internt)</div>
              </div>
              <span className={`badge ${tone}`}>{label} (nivå {level})</span>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn" type="button" onClick={() => setStep(1)}>
                Tillbaka
              </button>
              <button className="btn btn-primary" type="button" onClick={() => setStep(3)}>
                Nästa
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid" style={{ gap: 12 }}>
            <div>
              <div className="h2">Om det händer — hur allvarligt blir det?</div>
              <div className="small" style={{ marginTop: 6 }}>
                Tänk i termer av personskada, ohälsa, frånvaro och konsekvens för verksamheten.
              </div>
            </div>

            <div className="optionsGrid">
              {CONSEQUENCE_OPTIONS.map((o) => (
                <CardOption
                  key={o.value}
                  active={consequence === o.value}
                  title={`${o.label}`}
                  subtitle={o.example}
                  onClick={() => setConsequence(o.value)}
                />
              ))}
            </div>

            <div className="notice" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>Risknivå: {label}</div>
                <div className="small">
                  Sannolikhet {probability} × Konsekvens {consequence} = {level}
                </div>
              </div>
              <span className={`badge ${tone}`}>{highRisk ? "Hög risk → åtgärd krävs" : "OK"}</span>
            </div>

            <div>
              <div className="label">Notering (valfritt)</div>
              <textarea
                className="input"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex. orsaker, befintliga skydd, förslag på förbättring…"
              />
              <div className="small" style={{ marginTop: 6 }}>
                {highRisk ? "Hög risk prioriteras. En åtgärd skapas automatiskt (om aktiverat i systemet)." : ""}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn" type="button" onClick={() => setStep(2)}>
                Tillbaka
              </button>
              <button className="btn btn-primary" type="button" onClick={onSubmit} disabled={saving}>
                {saving ? "Sparar…" : "Spara riskbedömning"}
              </button>
            </div>

            <div className="small" style={{ opacity: 0.9 }}>
              Dokumentera alltid riskbedömning skriftligt och följ upp med åtgärder vid behov.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
