import { supabase } from './supabaseClient'

export async function ensureCompany() {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Not authenticated')
  }

  // Kolla om membership redan finns
  const { data: membership } = await supabase
    .from('memberships')
    .select('company_id, companies(name)')
    .eq('user_id', user.id)
    .maybeSingle()

  if (membership?.company_id) {
    return {
      companyId: membership.company_id,
      companyName: membership.companies?.name || 'Mitt företag'
    }
  }

  // Skapa nytt företag
  const companyName = user.email
    ? user.email.split('@')[0] + ' AB'
    : 'Mitt företag'

  const { data: newCompany, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: companyName,
      created_by: user.id
    })
    .select()
    .single()

  if (companyError) {
    throw companyError
  }

  // Skapa membership
  const { error: membershipError } = await supabase
    .from('memberships')
    .insert({
      company_id: newCompany.id,
      user_id: user.id,
      role: 'admin'
    })

  if (membershipError) {
    throw membershipError
  }

  return {
    companyId: newCompany.id,
    companyName: newCompany.name
  }
}
