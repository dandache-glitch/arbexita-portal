"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { Notice } from "@/components/ui/Notice";

export default function LoginClient() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const sp = useSearchParams();

  const next = sp.get("next") || "/app";
  const registered = sp.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInErr) {
      setError(signInErr.message);
      return;
    }

    if (!data.session) {
      setError("Kunde inte logga in. Kontrollera e-postbekräftelse i Supabase Auth.");
      return;
    }

    router.replace(next);
  }

  return (
    <div className="authWrap">
      <div className="authCard">
        <div className="authTop">
          <Logo variant="full" />
          <div>
            <div className="authTitle">Logga in</div>
            <div className="authSub">Tillgång till din SAM-portal och dokumentation.</div>
          </div>
        </div>

        {registered && (
          <Notice tone="success">
            Konto skapat. Om du har e-postbekräftelse aktiverad i Supabase behöver du bekräfta länken i mailet innan du
            kan logga in.
          </Notice>
        )}

        {error && <Notice tone="error">{error}</Notice>}

        <form onSubmit={onSubmit} className="authForm">
          <label className="label">
            E-post
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="namn@foretag.se"
              autoComplete="email"
              inputMode="email"
            />
          </label>

          <label className="label">
            Lösenord
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          <button className="button" type="submit" disabled={loading}>
            {loading ? "Loggar in…" : "Logga in"}
          </button>
        </form>

        <div className="small" style={{ marginTop: 12 }}>
          Inget konto?{" "}
          <Link href="/register" className="btn" style={{ padding: "6px 10px", marginLeft: 8 }}>
            Skapa konto
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
