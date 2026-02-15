import type { SupabaseClient } from "@supabase/supabase-js";
import type { ComplianceStatus } from "@/lib/app/compliance";

export async function getDashboardStats(supabase: SupabaseClient, companyId: string) {
  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);

  const [riskCount, incidentCount, policyExists, openActions, overdueActions] = await Promise.all([
    supabase.from("risks").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    supabase.from("incidents").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    supabase.from("policies").select("company_id", { count: "exact", head: true }).eq("company_id", companyId),
    supabase
      .from("actions")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .neq("status", "done"),
    supabase
      .from("actions")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .neq("status", "done")
      .lt("due_date", todayISO)
  ]);

  return {
    riskCount: riskCount.count ?? 0,
    incidentCount: incidentCount.count ?? 0,
    policyExists: (policyExists.count ?? 0) > 0,
    openActions: openActions.count ?? 0,
    overdueActions: overdueActions.count ?? 0
  };
}

export async function getComplianceStatus(
  supabase: SupabaseClient,
  companyId: string,
  annualReviewDone: boolean
): Promise<ComplianceStatus> {
  const stats = await getDashboardStats(supabase, companyId);
  return {
    policy: stats.policyExists,
    risk: stats.riskCount > 0,
    actions: stats.overdueActions === 0,
    incidents: stats.incidentCount > 0,
    annual: annualReviewDone,
    overdueActions: stats.overdueActions
  };
}
