import { supabase } from './supabaseClient'

export async function ensureCompany(): Promise<{ companyId: string, companyName: string }> {
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) throw new Error('Not authenticated')

  // 1) If user has pending invitation, auto-accept and create membership
  const email = user.email ?? ''
  if (email) {
    const inv = await supabase
      .from('invitations')
      .select('id, company_id, role')
      .ilike('email', email)
      .is('accepted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (inv.data?.company_id) {
      // create membership for this user (RLS allows via invite)
      await supabase.from('memberships').insert({
        company_id: inv.data.company_id,
        user_id: user.id,
        role: inv.data.role || 'member'
      })
      await supabase.from('invitations').update({ accepted_at: new Date().toISOString() }).eq('id', inv.data.id)
    }
  }

  // 2) Try find membership/company
  const mem = await supabase
    .from('memberships')
    .select('company_id, companies(name)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (mem.error) throw mem.error

  if (mem.data?.company_id) {
    const companyId = mem.data.company_id as string
    // @ts-ignore
    const companyName = (mem.data.companies?.name as string) ?? 'Mitt företag'
    await seedSingletons(companyId, companyName)
    return { companyId, companyName }
  }

  // 3) No membership: create company and make user admin
  const companyName = user.email ? user.email.split('@')[0] + ' AB' : 'Mitt företag'
  const created = await supabase
    .from('companies')
    .insert({ name: companyName, created_by: user.id })
    .select('id, name')
    .single()
  if (created.error) throw created.error
  const companyId = created.data.id as string

  const membership = await supabase
    .from('memberships')
    .insert({ company_id: companyId, user_id: user.id, role: 'admin' })
  if (membership.error) throw membership.error

  await seedSingletons(companyId, created.data.name as string)
  return { companyId, companyName: created.data.name as string }
}

async function seedSingletons(companyId: string, companyName: string) {
  await seedSingleRow('sam_policy', companyId, { text: defaultPolicy(companyName), approved: false })
  await seedSingleRow('sam_responsible', companyId, { name: '', email: '', phone: '' })
}

async function seedSingleRow(table: string, companyId: string, extra: any) {
  const existing = await supabase.from(table).select('id').eq('company_id', companyId).limit(1)
  if (existing.error) return
  if ((existing.data ?? []).length > 0) return
  await supabase.from(table).insert({ company_id: companyId, ...extra })
}

function defaultPolicy(company: string) {
  return `ARBETSMILJÖPOLICY\n\n${company} ska ha en trygg, säker och utvecklande arbetsmiljö.\n\nVi arbetar systematiskt genom att:\n• Regelbundet undersöka risker i verksamheten\n• Planera och genomföra åtgärder\n• Dokumentera risker, incidenter/tillbud och åtgärder\n• Följa upp arbetet minst årligen\n\nAnsvarig för SAM utses av ledningen. Policyn ses över minst en gång per år eller vid större förändringar.`
}
