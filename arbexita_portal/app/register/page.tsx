"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [company, setCompany] = useState("");
  const [orgnr, setOrgnr] = useState("");
  const [employees, setEmployees] = useState(1);
  const [industry, setIndustry] = useState("Kontor/IT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = supabaseBrowser();

    // Create auth user
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) {
      setLoading(false);
      return setError(error?.message ?? "Kunde inte skapa konto.");
    }

    // Create company + membership
    const { error: dbErr } = await supabase.from("companies").insert({
      name: company,
      orgnr,
      employees,
      industry,
      owner_user_id: data.user.id
    });
    setLoading(false);
    if (dbErr) return setError(dbErr.message);

    router.push("/app");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-xl w-full card p-8">
        <div className="h1">Skapa konto</div>
        <p className="small mt-2">Allt du behöver för SAM: riskbedömning, åtgärder, incidenter och dokumentation.</p>
        <form className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
          <div className="md:col-span-2">
            <div className="label">Företagsnamn</div>
            <input className="input" value={company} onChange={e=>setCompany(e.target.value)} required />
          </div>
          <div>
            <div className="label">Org.nr</div>
            <input className="input" value={orgnr} onChange={e=>setOrgnr(e.target.value)} placeholder="XXXXXX-XXXX" />
          </div>
          <div>
            <div className="label">Antal anställda</div>
            <input className="input" value={employees} onChange={e=>setEmployees(parseInt(e.target.value||"1",10))} type="number" min={1} />
          </div>
          <div className="md:col-span-2">
            <div className="label">Bransch</div>
            <input className="input" value={industry} onChange={e=>setIndustry(e.target.value)} />
          </div>
          <div>
            <div className="label">E-post</div>
            <input className="input" value={email} onChange={e=>setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <div className="label">Lösenord</div>
            <input className="input" value={password} onChange={e=>setPassword(e.target.value)} type="password" required />
          </div>
          {error && <div className="md:col-span-2 text-sm text-red-700">{error}</div>}
          <button className="btn btn-primary md:col-span-2" disabled={loading}>
            {loading ? "Skapar..." : "Skapa konto & gå till portalen"}
          </button>
        </form>
        <div className="small mt-4">
          Har du konto? <Link className="underline" href="/login">Logga in</Link>
        </div>
      </div>
    </main>
  );
}
