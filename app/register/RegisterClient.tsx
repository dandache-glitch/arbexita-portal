"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

type IndustryValue =
  | "kontor"
  | "bygg"
  | "industri"
  | "butik"
  | "transport"
  | "vard"
  | "restaurang"
  | "skola"
  | "annan";

export default function RegisterClient() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState<IndustryValue>("kontor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const cleanCompanyName = companyName.trim();

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          company_name: cleanCompanyName || "Företaget",
          industry,
        },
      },
    });

    if (error) {
      setLoading(false);
      setErr(error.message);
      return;
    }

    /**
     * Viktigt:
     * - Om email confirmation är OFF får du ofta session direkt.
     * - Om den är ON får du ingen session -> user måste bekräfta mail.
     */
    const hasSession = Boolean(data.session);

    setLoading(false);

    if (hasSession) {
      router.replace("/app");
      return;
    }

    // Email confirmation är troligen på
    router.replace("/login?registered=1");
  }

  return (
    <div className="authCard">
      <h1 className="authTitle">Skapa konto</h1>
      <p className="authSubtitle">Kom igång med Arbexita på 2 minuter.</p>

      <form onSubmit={onSubmit} className="authForm">
        <label className="authLabel">
          Företagsnamn
          <input
            className="authInput"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Ex. Arbexita AB"
            autoComplete="organization"
          />
        </label>

        <label className="authLabel">
          Bransch
          <select
            className="authInput"
            value={industry}
            onChange={(e) => setIndustry(e.target.value as IndustryValue)}
          >
            <option value="kontor">Kontor</option>
            <option value="bygg">Bygg</option>
            <option value="industri">Industri</option>
            <option value="butik">Butik</option>
            <option value="transport">Transport</option>
            <option value="vard">Vård</option>
            <option value="restaurang">Restaurang</option>
            <option value="skola">Skola</option>
            <option value="annan">Annan</option>
          </select>
        </label>

        <label className="authLabel">
          E-post
          <input
            className="authInput"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="namn@foretag.se"
            autoComplete="email"
            inputMode="email"
          />
        </label>

        <label className="authLabel">
          Lösenord
          <input
            className="authInput"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Minst 8 tecken"
            autoComplete="new-password"
          />
        </label>

        {err && <div className="authError">{err}</div>}

        <button className="authButton" type="submit" disabled={loading}>
          {loading ? "Skapar konto…" : "Skapa konto"}
        </button>

        <p className="authHint">
          Har du redan ett konto?{" "}
          <a className="authLink" href="/login">
            Logga in
          </a>
        </p>
      </form>
    </div>
  );
}
