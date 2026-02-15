"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useAuth } from "@/app/providers/AuthProvider";
import { useCompany } from "@/app/providers/CompanyProvider";

type ActionStatus = "open" | "done";

export default function NewActionPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);
  const { user } = useAuth();
  const { isLoading: companyLoading, company } = useCompany();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [status, setStatus] = useState<ActionStatus>("open");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Inte inloggad.");
      return;
    }

    if (companyLoading) {
      setError("Laddar företag… försök igen om en sekund.");
      return;
    }

    if (!company?.id) {
      setError("Företag saknas för kontot. Kontakta support.");
      return;
    }

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Titel krävs.");
      return;
    }

    setSaving(true);

    const payload = {
      company_id: company.id,
      owner_user_id: user.id,
      title: cleanTitle,
      description: description.trim() || null,
      status,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      created_at: new Date().toISOString(),
    };

    const { error: insertErr } = await supabase.from("actions").insert(payload);

    setSaving(false);

    if (insertErr) {
      setError(insertErr.message);
      return;
    }

    router.replace("/app/atgarder");
  }

  return (
    <div className="page">
      <div className="pageHeader">
        <h1>Ny åtgärd</h1>
        <p>Skapa en ny åtgärd kopplad till ditt företag.</p>
      </div>

      <div className="card">
        <form onSubmit={onSubmit} className="form">
          <label className="label">
            Titel
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Uppdatera rutiner för skyddsutrustning"
              autoComplete="off"
            />
          </label>

          <label className="label">
            Beskrivning (valfritt)
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskriv åtgärden kort…"
              rows={4}
            />
          </label>

          <label className="label">
            Deadline (valfritt)
            <input
              className="input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>

          <label className="label">
            Status
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as ActionStatus)}>
              <option value="open">Öppen</option>
              <option value="done">Klar</option>
            </select>
          </label>

          {error && <div className="errorBox">{error}</div>}

          <button className="button" type="submit" disabled={saving}>
            {saving ? "Sparar…" : "Skapa åtgärd"}
          </button>
        </form>
      </div>
    </div>
  );
}
