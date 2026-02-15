"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { INDUSTRIES, IndustryKey } from "@/lib/app/industries";
import { Logo } from "@/components/ui/Logo";
import { Notice } from "@/components/ui/Notice";

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

    const cleanCompanyName = companyName.trim() || "Företaget";
    const cleanEmail = email.trim();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          company_name: cleanCompanyName,
          industry,
        },
      },
    });

    if (error) {
      setLoading(false);
      setErr(error.message);
      return;
    }

    setLoading(false);

    // If email confirmations are ON, session may be null (user must confirm email).
    // If OFF, session exists and user can enter app immediately.
    if (data.session) {
      router.replace("/app");
      return;
    }

    router.replace("/login?registered=1");
  }

  return (
    <div className="container">
      <div className="card" style={{ padding: 24, maxWidth: 760, margin: "34px auto" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <Logo />
        </div>
        <div className="h1">Skapa konto</div>
        <p className="small" style={{ marginTop: 6 }}>
          Arbexita är ett verktyg som hjälper dig att strukturera och dokumentera SAM-arbetet. Välj bransch för att få rätt mallar.
        </p>

        <form onSubmit={onSubmit} style={{ marginTop: 16, display: "grid", gap: 14 }}>
          <div className="grid grid-2">
            <div>
              <div className="label">Företagsnamn</div>
              <input
                className="input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex. Arbexita AB"
                autoComplete="organization"
              />
            </div>
            <div>
              <div className="label">Bransch</div>
              <select className="input" value={industry} onChange={(e) => setIndustry(e.target.value as IndustryKey)}>
                {INDUSTRIES.map((i) => (
                  <option key={i.key} value={i.key}>
                    {i.name}
                  </option>
                ))}
              </select>
              <div className="small" style={{ marginTop: 6 }}>
                {INDUSTRIES.find((x) => x.key === industry)?.description}
              </div>
            </div>
          </div>

          <div className="grid grid-2">
            <div>
              <div className="label">E-post</div>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <div className="label">Lösenord</div>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <div className="small" style={{ marginTop: 6 }}>Minst 8 tecken rekommenderas.</div>
            </div>
          </div>

          {err && <Notice tone="error">{err}</Notice>}

          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Skapar konto..." : "Skapa konto"}
          </button>
        </form>

        <div className="small" style={{ marginTop: 14 }}>
          Har du redan konto?{" "}
          <Link href="/login" className="btn" style={{ padding: "6px 10px", marginLeft: 8 }}>
            Logga in
          </Link>
        </div>

        <div className="small" style={{ marginTop: 12 }}>
          <Link href="/" className="btn btn-ghost" style={{ padding: "6px 10px" }}>
            Till startsidan
          </Link>
        </div>
      </div>
    </div>
  );
}
