import { supabaseBrowser } from "@/lib/supabase/client";

export async function getContext() {
  const supabase = supabaseBrowser();
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) throw new Error("Not authenticated");

  const { data: company, error } = await supabase
    .from("companies")
    .select("id, name, industry")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!company?.id) throw new Error("No company found (did you register via the portal?)");

  return {
    supabase,
    userId: user.id,
    companyId: company.id as string,
    companyName: (company.name as string) || "Företaget",
    industry: (company.industry as string) || "kontor"
  };
}

export function riskLevel(probability: number, consequence: number) {
  const p = Math.max(1, Math.min(5, probability));
  const c = Math.max(1, Math.min(5, consequence));
  return p * c;
}
