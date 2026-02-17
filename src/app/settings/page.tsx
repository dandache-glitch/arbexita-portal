'use client'
import { useEffect, useState } from 'react'
import AppShell from '../../components/AppShell'
import { supabase } from '../../lib/supabaseClient'
import { ensureCompany } from '../../lib/bootstrapCompany'

export default function SettingsPage() {
  const [companyId, setCompanyId] = useState('')
  const [companyName, setCompanyName] = useState('Mitt företag')
  const [orgnr, setOrgnr] = useState('')
  const [resp, setResp] = useState({ name:'', email:'', phone:'' })

  const [members, setMembers] = useState<any[]>([])
  const [invites, setInvites] = useState<any[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin'|'member'>('member')

  useEffect(() => { (async ()=>{ const c=await ensureCompany(); setCompanyId(c.companyId); setCompanyName(c.companyName) })() }, [])
  useEffect(() => { if (!companyId) return; refresh() }, [companyId])

  async function refresh() {
    const [c, r, m, i] = await Promise.all([
      supabase.from('companies').select('orgnr').eq('id', companyId).maybeSingle(),
      supabase.from('sam_responsible').select('*').eq('company_id', companyId).maybeSingle(),
      supabase.from('memberships').select('id,user_id,role,created_at').eq('company_id', companyId).order('created_at',{ascending:true}),
      supabase.from('invitations').select('*').eq('company_id', companyId).order('created_at',{ascending:false}),
    ])
    setOrgnr(c.data?.orgnr ?? '')
    setResp({ name: r.data?.name ?? '', email: r.data?.email ?? '', phone: r.data?.phone ?? '' })
    setMembers(m.data ?? [])
    setInvites(i.data ?? [])
  }

  async function save() {
    await supabase.from('companies').update({ orgnr }).eq('id', companyId)
    await supabase.from('sam_responsible').update({ ...resp, updated_at: new Date().toISOString() }).eq('company_id', companyId)
    alert('Sparat.')
    await refresh()
  }

  async function createInvite() {
    const email = inviteEmail.trim()
    if (!email) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('invitations').upsert({
      company_id: companyId,
      email,
      role: inviteRole,
      invited_by: user?.id ?? null
    })
    setInviteEmail('')
    await refresh()
    alert('Inbjudan skapad. Personen måste skapa konto med samma email, då kopplas de automatiskt till företaget.')
  }

  async function deleteInvite(id: string) {
    await supabase.from('invitations').delete().eq('id', id)
    await refresh()
  }

  return (
    <AppShell>
      <div className="h1">Inställningar</div>
      <div className="muted">Företagsuppgifter, SAM-ansvarig och team. Team gör att du kan ta mer betalt och kunden stannar längre.</div>

      <div className="grid cols2" style={{marginTop:14}}>
        <div className="card">
          <div className="h2">Företag</div>
          <label>Företagsnamn</label>
          <input value={companyName} readOnly />
          <label>Organisationsnummer (valfritt)</label>
          <input value={orgnr} onChange={e=>setOrgnr(e.target.value)} placeholder="XXXXXX-XXXX" />
          <hr />
          <div className="h2">SAM-ansvarig</div>
          <label>Namn</label>
          <input value={resp.name} onChange={e=>setResp({...resp, name:e.target.value})} placeholder="Namn" />
          <label>Email</label>
          <input value={resp.email} onChange={e=>setResp({...resp, email:e.target.value})} placeholder="email@företag.se" />
          <label>Telefon</label>
          <input value={resp.phone} onChange={e=>setResp({...resp, phone:e.target.value})} placeholder="+46..." />
          <div className="row" style={{marginTop:12}}>
            <button className="btn" onClick={save}>Spara</button>
          </div>
        </div>

        <div className="card">
          <div className="h2">Team</div>
          <div className="muted">Bjud in via email. När personen skapar konto med samma email kopplas de automatiskt.</div>

          <div className="grid cols2" style={{marginTop:10}}>
            <div>
              <label>Email att bjuda in</label>
              <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="kollega@företag.se" />
            </div>
            <div>
              <label>Roll</label>
              <select value={inviteRole} onChange={e=>setInviteRole(e.target.value as any)}>
                <option value="member">Medlem</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <button className="btn" onClick={createInvite} style={{marginTop:10}}>Skapa inbjudan</button>

          <hr />

          <div className="h2">Medlemmar</div>
          <table className="table">
            <thead><tr><th>User ID</th><th>Roll</th></tr></thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td className="muted">{m.user_id}</td>
                  <td><span className="badge ok">{m.role}</span></td>
                </tr>
              ))}
              {members.length===0 && <tr><td colSpan={2} className="muted">Inga medlemmar.</td></tr>}
            </tbody>
          </table>

          <div className="h2" style={{marginTop:14}}>Inbjudningar</div>
          <table className="table">
            <thead><tr><th>Email</th><th>Roll</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {invites.map(i => (
                <tr key={i.id}>
                  <td>{i.email}</td>
                  <td><span className="badge">{i.role}</span></td>
                  <td className="muted">{i.accepted_at ? 'Accepterad' : 'Väntar'}</td>
                  <td><button className="btn danger" onClick={()=>deleteInvite(i.id)}>Ta bort</button></td>
                </tr>
              ))}
              {invites.length===0 && <tr><td colSpan={4} className="muted">Inga inbjudningar.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
