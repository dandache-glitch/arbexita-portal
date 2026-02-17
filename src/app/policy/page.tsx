'use client'
import { useEffect, useState } from 'react'
import AppShell from '../../components/AppShell'
import { supabase } from '../../lib/supabaseClient'
import { ensureCompany } from '../../lib/bootstrapCompany'

export default function PolicyPage() {
  const [companyId, setCompanyId] = useState('')
  const [companyName, setCompanyName] = useState('Mitt företag')
  const [policyId, setPolicyId] = useState<string|undefined>(undefined)
  const [text, setText] = useState('')
  const [approved, setApproved] = useState(false)
  const [approvedBy, setApprovedBy] = useState('')
  const [approvedOn, setApprovedOn] = useState<string|undefined>(undefined)

  useEffect(() => { (async ()=>{ const c=await ensureCompany(); setCompanyId(c.companyId); setCompanyName(c.companyName) })() }, [])
  useEffect(() => { if (!companyId) return; (async ()=> {
    const p = await supabase.from('sam_policy').select('*').eq('company_id', companyId).maybeSingle()
    if (p.data) {
      setPolicyId(p.data.id)
      setText(p.data.text ?? '')
      setApproved(!!p.data.approved)
      setApprovedBy(p.data.approved_by ?? '')
      setApprovedOn(p.data.approved_on ?? undefined)
    }
  })() }, [companyId])

  async function save() {
    if (!companyId) return
    if (policyId) await supabase.from('sam_policy').update({ text, updated_at: new Date().toISOString() }).eq('id', policyId)
  }

  async function approve() {
    if (!companyId || !policyId) return
    const name = approvedBy.trim() || 'Ledning'
    const today = new Date().toISOString().slice(0,10)
    await supabase.from('sam_policy').update({ text, approved: true, approved_by: name, approved_on: today, updated_at: new Date().toISOString() }).eq('id', policyId)
    setApproved(true); setApprovedOn(today); setApprovedBy(name)
  }

  async function revoke() {
    if (!companyId || !policyId) return
    await supabase.from('sam_policy').update({ approved: false, approved_by: '', approved_on: null, updated_at: new Date().toISOString() }).eq('id', policyId)
    setApproved(false); setApprovedBy(''); setApprovedOn(undefined)
  }

  return (
    <AppShell>
      <div className="row" style={{justifyContent:'space-between'}}>
        <div>
          <div className="h1">Arbetsmiljöpolicy</div>
          <div className="muted">Skapa och godkänn er policy. Godkännandet ger “myndighetskänsla” i rapporten.</div>
        </div>
        <span className={'badge ' + (approved ? 'ok' : 'warn')}>{approved ? 'GODKÄND' : 'EJ GODKÄND'}</span>
      </div>

      <div className="card" style={{marginTop:14}}>
        <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
          <div className="stamp">
            <span style={{fontWeight:1000}}>Dokument</span>
            <span className="muted">Arbetsmiljöpolicy</span>
          </div>
          <div className="muted">{companyName}{approvedOn ? ` • Godkänd ${approvedOn}` : ''}</div>
        </div>

        <label>Policytext</label>
        <textarea value={text} onChange={e=>setText(e.target.value)} />

        <div className="grid cols2" style={{marginTop:10}}>
          <div>
            <label>Godkänd av (namn)</label>
            <input value={approvedBy} onChange={e=>setApprovedBy(e.target.value)} placeholder="Ex: VD / Ägare" />
          </div>
          <div>
            <label>Status</label>
            <input value={approved ? `Godkänd ${approvedOn}` : 'Ej godkänd'} readOnly />
          </div>
        </div>

        <div className="row" style={{marginTop:12}}>
          <button className="btn secondary" onClick={save}>Spara</button>
          {!approved && <button className="btn" onClick={approve}>Godkänn policy</button>}
          {approved && <button className="btn danger" onClick={revoke}>Återkalla</button>}
          <a className="btn secondary" href="/reports">Exportera PDF</a>
        </div>
      </div>
    </AppShell>
  )
}
