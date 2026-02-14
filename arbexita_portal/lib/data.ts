import { supabaseServer } from "@/lib/supabase/server";

export async function getMyCompany() {
  const supabase = supabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_user_id", userData.user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getDashboardStats(companyId: string) {
  const supabase = supabaseServer();

  const [risks, actions, incidents, policy] = await Promise.all([
    supabase.from("risks").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "open"),
    supabase.from("actions").select("id", { count: "exact", head: true }).eq("company_id", companyId).neq("status", "done"),
    supabase.from("incidents").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    supabase.from("policies").select("id, signed_at").eq("company_id", companyId).order("created_at", { ascending: false }).limit(1)
  ]);

  const openRisks = risks.count ?? 0;
  const openActions = actions.count ?? 0;
  const incidentCount = incidents.count ?? 0;
  const hasPolicy = (policy.data?.[0]?.id ?? null) !== null;

  // Very simple scoring (tunable)
  const score = Math.round(
    (hasPolicy ? 20 : 0) +
    Math.min(25, openRisks === 0 ? 25 : 10) +
    Math.min(25, openActions === 0 ? 25 : 10) +
    Math.min(15, incidentCount > 0 ? 10 : 15) +
    15 // baseline "uppföljning" placeholder; you can tie this to annual review later
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    openRisks,
    openActions,
    incidentCount,
    hasPolicy
  };
}
