"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getContext } from "@/lib/app/db";

export default function NewActionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const ctx = await getContext();
      const { error } = await ctx.supabase.from("actions").insert({
        company_id: ctx.companyId,
        owner_user_id: ctx.userId,
        title: title || "Åtgärd",
        description,
        status: "open",
        due_date: due
      });
      if (error) throw error;
      router.replace("/app/atgarder");
    } catch (e: any) {
      setErr(e?.message || "Något gick fel.");
    }
    setLoading(false);
  }

  return (
    <div className="container">
      <div className="h1">Ny åtgärd</div>
      <div className="small" style={{ marginTop: 6 }}>Sätt deadline och följ upp tills den är klar.</div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
          <div>
            <div className="label">Titel</div>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Åtgärda halkrisk – mattor vid entré" />
          </div>
          <div>
            <div className="label">Beskrivning</div>
            <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <div>
            <div className="label">Deadline</div>
            <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>

          {err && <div className="small" style={{ color: "#ffb4b4" }}>{err}</div>}
          <button className="btn btn-primary" disabled={loading}>{loading ? "Sparar..." : "Spara åtgärd"}</button>
        </form>
      </div>
    </div>
  );
}
