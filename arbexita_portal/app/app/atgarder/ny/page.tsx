"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NewActionPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [responsible, setResponsible] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const router = useRouter();

  async function loadCompanyId(): Promise<string> {
    const supabase = supabaseBrowser();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not logged in");
    const { data: company, error } = await supabase
      .from("companies").select("id")
      .eq("owner_user_id", userData.user.id).maybeSingle();
    if (error || !company) throw new Error(error?.message ?? "No company");
    return company.id;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const supabase = supabaseBrowser();
      const companyId = await loadCompanyId();
      const { error } = await supabase.from("actions").insert({
        company_id: companyId,
        title,
        description: description || null,
        responsible: responsible || null,
        deadline: deadline || null,
        status: "todo"
      });
      if (error) throw error;
      router.push("/app/atgarder");
    } catch (e:any) {
      setError(e.message ?? "Fel");
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl">
      <div className="h1">Ny åtgärd</div>
      <form className="card p-6 mt-5 space-y-4" onSubmit={onSubmit}>
        <div>
          <div className="label">Titel</div>
          <input className="input" value={title} onChange={e=>setTitle(e.target.value)} required />
        </div>
        <div>
          <div className="label">Beskrivning</div>
          <textarea className="input" value={description} onChange={e=>setDescription(e.target.value)} rows={4} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="label">Ansvarig</div>
            <input className="input" value={responsible} onChange={e=>setResponsible(e.target.value)} />
          </div>
          <div>
            <div className="label">Deadline</div>
            <input className="input" type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} />
          </div>
        </div>
        {error && <div className="text-sm text-red-700">{error}</div>}
        <button className="btn btn-primary" disabled={loading}>{loading ? "Sparar..." : "Spara åtgärd"}</button>
      </form>
    </div>
  );
}
