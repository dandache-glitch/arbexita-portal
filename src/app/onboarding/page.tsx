'use client'
import { useEffect, useMemo, useState } from 'react'
import AppShell from '../../components/AppShell'
import { ensureCompany } from '../../lib/bootstrapCompany'
import { supabase } from '../../lib/supabaseClient'
import { templates, type Industry, industryLabels } from '../../lib/templates'
import { computeRiskLevel } from '../../lib/riskLevel'

type Step = 1|2|3|4

export default function OnboardingPage() {
  const [companyId, setCompanyId] = useState('')
  const [step, setStep] = useState<Step>(1)
  const [industry, setIndustry] = useState<Industry>('kontor')
  const [busy, setBusy] = useState(false)
  const [resp, setResp] = useState({ name:'', email:'', phone:'' })
  const [approvedBy, setApprovedBy] = useState('')

  useEffect(()=>{ (async()=>{ const c=await ensureCompany(); setCompanyId(c.companyId) })() }, [])

  const stepTitle = useMemo(()=>{
    if (step===1) return 'Välj bransch (1 min)'
    if (step===2) return 'Sätt ansvarig (30 sek)'
    if (step===3) return 'Godkänn policy (30 sek)'
    return 'Klart'
  }, [step])

  async function seedIndustry() {
    setBusy(true)
    try {
      const t = templates(industry)
      // insert risks if none exist
      const existing = await supabase.from('sam_risks').select('id').eq('company_id', companyId).limit(1)
      if ((existing.data ?? []).length === 0) {
        const rows = t.risks.map(r => ({
          company_id: companyId,
          title: r.title,
          area: r.area || '',
          description: '',
          likelihood: r.likelihood,
          consequence: r.consequence,
          risk_level: computeRiskLevel(r.likelihood as any, r.consequence as any),
          measure: r.measure,
          owner: '',
          due_on: null,
          status: 'open'
        }))
        if (rows.length) await supabase.from('sam_risks').insert(rows)
      }
      const existingActions = await supabase.from('sam_actions').select('id').eq('company_id', companyId).limit(1)
      if ((existingActions.data ?? []).length === 0) {
        const aRows = t.actions.map(a => ({
          company_id: companyId,
          description: a.description,
          owner: '',
          due_on: null,
          status: 'open',
          source: 'template'
        }))
        if (aRows.length) await supabase.from('sam_actions').insert(aRows)
      }
      setStep(2)
    } finally {
      setBusy(false)
    }
  }

  async function saveResponsible() {
    setBusy(true)
    try {
      await supabase.from('sam_responsible').update({ ...resp, updated_at: new Date().toISOString() }).eq('company_id', companyId)
      setStep(3)
    } finally { setBusy(false) }
  }

  async function approvePolicy() {
    setBusy(true)
    try {
      const name = approvedBy.trim() || 'Ledning'
      const today = new Date().toISOString().slice(0,10)
      await supabase.from('sam_policy').update({
        approved: true,
        approved_by: name,
        approved_on: today,
        updated_at: new Date().toISOString()
      }).eq('company_id', companyId)
      setStep(4)
    } finally { setBusy(false) }
  }

  return (
    <AppShell>
      <div className="card">
        <div className="h1">Kom igång (90 sek)</div>
        <div className="muted">Du blir “inspektionsredo” snabbare. Vi skapar en grund och du kan justera allt senare.</div>
        <hr />
        <div className="stamp"><span className="badge ok">Steg {step}/4</span><span style={{fontWeight:1000}}>{stepTitle}</span></div>

        {step===1 && (
          <div style={{marginTop:14}}>
            <div className="h2">Välj bransch</div>
            <div className="muted">Vi lägger in vanliga risker och åtgärder som start (du kan ta bort senare).</div>
            <label>Bransch</label>
            <select value={industry} onChange={e=>setIndustry(e.target.value as Industry)}>
              {Object.keys(industryLabels).map(k => (
                <option key={k} value={k}>{industryLabels[k as Industry]}</option>
              ))}
            </select>
            <div className="row" style={{marginTop:12}}>
              <button className="btn" onClick={seedIndustry} disabled={!companyId || busy}>
                {busy ? 'Skapar…' : 'Skapa grund'}
              </button>
              <a className="btn secondary" href="/">Hoppa över</a>
            </div>
          </div>
        )}

        {step===2 && (
          <div style={{marginTop:14}}>
            <div className="h2">SAM-ansvarig</div>
            <div className="muted">Vem håller ihop SAM? Detta syns i rapporten.</div>
            <label>Namn</label>
            <input value={resp.name} onChange={e=>setResp({...resp, name:e.target.value})} placeholder="Namn" />
            <label>Email (valfritt)</label>
            <input value={resp.email} onChange={e=>setResp({...resp, email:e.target.value})} placeholder="email@företag.se" />
            <label>Telefon (valfritt)</label>
            <input value={resp.phone} onChange={e=>setResp({...resp, phone:e.target.value})} placeholder="+46..." />
            <div className="row" style={{marginTop:12}}>
              <button className="btn" onClick={saveResponsible} disabled={busy || !resp.name.trim()}>
                {busy ? 'Sparar…' : 'Spara & fortsätt'}
              </button>
              <button className="btn secondary" onClick={()=>setStep(3)}>Hoppa över</button>
            </div>
          </div>
        )}

        {step===3 && (
          <div style={{marginTop:14}}>
            <div className="h2">Godkänn arbetsmiljöpolicy</div>
            <div className="muted">Ger “myndighetskänsla” i PDF-rapporten. Du kan ändra texten senare under Policy.</div>
            <label>Godkänd av</label>
            <input value={approvedBy} onChange={e=>setApprovedBy(e.target.value)} placeholder="Ex: VD / Ägare" />
            <div className="row" style={{marginTop:12}}>
              <button className="btn" onClick={approvePolicy} disabled={busy}>
                {busy ? 'Godkänner…' : 'Godkänn policy'}
              </button>
              <a className="btn secondary" href="/policy">Se policytext</a>
            </div>
          </div>
        )}

        {step===4 && (
          <div style={{marginTop:14}}>
            <div className="h2">Klart ✅</div>
            <div className="muted">Nu har du en grund: policy, ansvar, risker och åtgärdsplan. Nästa steg: gör en månadsbekräftelse och uppföljning.</div>
            <div className="row" style={{marginTop:12}}>
              <a className="btn" href="/">Gå till status</a>
              <a className="btn secondary" href="/reports">Ladda ner PDF</a>
              <a className="btn secondary" href="/inspection">Inspektionsläge</a>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
