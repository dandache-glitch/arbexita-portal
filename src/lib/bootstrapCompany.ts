import { supabase } from './supabaseClient'

export async function ensureCompany() {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Not authenticated')
  }

  // 1. Kolla membership
  const { data: membership } = await supabase
    .from('memberships')
    .select('company_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (membership?.company_id) {
    return {
      companyId: membership.company_id,
      companyName: 'Mitt företag'
    }
  }

  // 2. Skapa företag UTAN select()
  const { data: newCompany, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: 'Mitt företag',
      created_by: user.id
    })
    .select('id')
    .single()

  if (companyError) {
    throw companyError
  }

  // 3. Skapa membership
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
    companyName: 'Mitt företag'
  }
}
