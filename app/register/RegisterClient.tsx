"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { INDUSTRIES, IndustryKey } from "@/lib/app/industries";

export default function RegisterClient() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState<IndustryKey>("kontor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setLoading(false);
      // tips: rate limit / email confirm
      return setErr(error.message + " (Tips: I Supabase, stäng av Email confirmations under Auth för smidig test.)");
    }

    const userId = data.user?.id;
    if (!userId) {
      setLoading(false);
      return setErr("Kunde inte skapa användare. (Kontrollera Email confirmations i Supabase.)");
    }

    const { error: companyErr } = await supabase.from("companies").insert({
      owner_user_id: userId,
      name: companyName || "Företaget",
      industry
    });

    setLoading(false);
    if (companyErr) return setErr(companyErr.message);

    router.replace("/app");
  }

  return (
    <div className="container">
      <div className="card" style={{ padding: 24, maxWidth: 720, margin: "34px auto" }}>
        <div className="h1">Skapa konto</div>
        <p className="small" style={{ marginTop: 6 }}>
          Välj bransch så laddas rätt checklistor och dokument direkt. Målet är 100% compliance.
        </p>

        <form onSubmit={onSubmit} style={{ marginTop: 16, display: "grid", gap: 14 }}>
          <div className="grid grid-2">
            <div>
              <div className="label">Företagsnamn</div>
              <input className="input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ex. Arbexita AB" />
            </div>
            <div>
              <div className="label">Bransch</div>
              <select className="input" value={industry} onChange={(e) => setIndustry(e.target.value as IndustryKey)}>
                {INDUSTRIES.map((i) => (<option key={i.key} value={i.key}>{i.name}</option>))}
              </select>
              <div className="small" style={{ marginTop: 6 }}>{INDUSTRIES.find((x) => x.key === industry)?.description}</div>
            </div>
          </div>

          <div className="grid grid-2">
            <div>
              <div className="label">E-post</div>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <div className="label">Lösenord</div>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <div className="small" style={{ marginTop: 6 }}>Minst 8 tecken rekommenderas.</div>
            </div>
          </div>

          {err && <div className="small" style={{ color: "#ffb4b4" }}>{err}</div>}

          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Skapar konto..." : "Skapa konto"}
          </button>
        </form>

        <div className="small" style={{ marginTop: 14 }}>
          Har du redan konto? <Link href="/login" className="btn" style={{ padding: "6px 10px", marginLeft: 8 }}>Logga in</Link>
        </div>
      </div>
    </div>
  );
}
