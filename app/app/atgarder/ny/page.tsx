"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/app/providers/AuthProvider";
import { useCompany } from "@/app/providers/CompanyProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { Notice } from "@/components/ui/Notice";

export default function NewActionPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const { user } = useAuth();
  const company = useCompany();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user || !company.companyId) {
      setError("Inte inloggad.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("actions").insert({
      company_id: company.companyId,
      owner_user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      status: "open",
      due_date: dueDate || null
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.replace("/app/atgarder");
  }

  return (
    <div className="container">
      <PageHeader
        title="Ny åtgärd"
        subtitle={<>Skapa en konkret åtgärd med tydlig deadline. Det gör compliance mätbar.</>}
        right={<Link className="btn" href="/app/atgarder">Till åtgärder</Link>}
      />

      <div className="card" style={{ padding: 16, marginTop: 14, maxWidth: 920 }}>
        {error ? <Notice tone="error">{error}</Notice> : null}

        <form onSubmit={onSubmit} style={{ marginTop: 12, display: "grid", gap: 14 }}>
          <div>
            <div className="label">Titel</div>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex. Sätta upp halkskydd vid entré" />
          </div>

          <div>
            <div className="label">Beskrivning</div>
            <textarea className="input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Vad ska göras? Vem? Hur ska det följas upp?" />
          </div>

          <div className="grid grid-2">
            <div>
              <div className="label">Deadline</div>
              <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <div className="label">Status</div>
              <input className="input" value="Öppen" disabled />
            </div>
          </div>

          <button className="btn btn-primary" disabled={saving || !title.trim()}>
            {saving ? "Sparar…" : "Spara åtgärd"}
          </button>
        </form>
      </div>
    </div>
  );
}
