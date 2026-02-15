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
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const cleanEmail = email.trim();

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    router.replace(next);
  }

  return (
    <div className="container">
      <div className="card" style={{ padding: 24, maxWidth: 560, margin: "40px auto" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <Logo />
        </div>

        <div className="h1">Logga in</div>
        <p className="small" style={{ marginTop: 6 }}>
          Logga in för att få överblick över risker, åtgärder, incidenter och dokumentation.
        </p>

        {registered && (
          <Notice tone="info">
            Konto skapat. Om du har e-postbekräftelse aktiverad i Supabase behöver du bekräfta länken i mailet innan du kan logga in.
          </Notice>
        )}

        <form onSubmit={onSubmit} style={{ marginTop: 16, display: "grid", gap: 12 }}>
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
              autoComplete="current-password"
            />
          </div>

          {err && <Notice tone="error">{err}</Notice>}

          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Loggar in..." : "Logga in"}
          </button>
        </form>

        <div className="small" style={{ marginTop: 14 }}>
          Saknar konto?{" "}
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
