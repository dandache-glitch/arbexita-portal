'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { ensureCompany } from '@/lib/bootstrapCompany'

export default function InspectionPage() {
  const [companyId, setCompanyId] = useState('')
  const [policy, setPolicy] = useState<any>(null)
  const [resp, setResp] = useState<any>(null)
  const [riskCount, setRiskCount] = useState(0)
  const [incidentCount, setIncidentCount] = useState(0)
  const [openActions, setOpenActions] = useState(0)
  const [lastReview, setLastReview] = useState<string>('—')
  const [audit, setAudit] = useState<any[]>([])

  useEffect(()=>{ (async()=>{ const c=await ensureCompany(); setCompanyId(c.companyId) })() }, [])
  useEffect(()=>{ if(!companyId) return; (async()=>{
    const [p,r,risks,inc,acts,rev,log] = await Promise.all([
      supabase.from('sam_policy').select('*').eq('company_id', companyId).maybeSingle(),
      supabase.from('sam_responsible').select('*').eq('company_id', companyId).maybeSingle(),
      supabase.from('sam_risks').select('id').eq('company_id', companyId),
      supabase.from('sam_incidents').select('id').eq('company_id', companyId),
      supabase.from('sam_actions').select('status').eq('company_id', companyId),
      supabase.from('sam_reviews').select('review_date').eq('company_id', companyId).order('review_date',{ascending:false}).limit(1),
      supabase.from('sam_audit_log').select('*').eq('company_id', companyId).order('created_at',{ascending:false}).limit(12)
    ])
    setPolicy(p.data); setResp(r.data)
    setRiskCount((risks.data ?? []).length)
    setIncidentCount((inc.data ?? []).length)
    setOpenActions((acts.data ?? []).filter((a:any)=>a.status==='open').length)
    setLastReview(rev.data?.[0]?.review_date ?? '—')
    setAudit(log.data ?? [])
  })() }, [companyId])

  return (
    <AppShell>
      <div className="row" style={{justifyContent:'space-between'}}>
        <div>
          <div className="h1">Inspektionsläge</div>
          <div className="muted">Read-only sammanställning + beviskedja (audit trail). Visa eller exportera PDF.</div>
        </div>
        <div className="row">
          <a className="btn secondary" href="/reports">PDF</a>
          <a className="btn" href="/">Status</a>
        </div>
      </div>

      <div className="grid cols3" style={{marginTop:14}}>
        <div className="card">
          <div className="h2">Policy</div>
          <div className={'badge ' + (policy?.approved ? 'ok' : 'warn')}>{policy?.approved ? 'GODKÄND' : 'EJ GODKÄND'}</div>
          <div className="muted" style={{marginTop:8}}>Godkänd av: {policy?.approved_by || '—'}</div>
          <div className="muted">Datum: {policy?.approved_on || '—'}</div>
        </div>
        <div className="card">
          <div className="h2">Ansvar</div>
          <div style={{fontWeight:1000}}>{resp?.name || '—'}</div>
          <div className="muted">{resp?.email || '—'}</div>
          <div className="muted">{resp?.phone || '—'}</div>
        </div>
        <div className="card">
          <div className="h2">Nyckeltal</div>
          <div className="muted">Risker: <b>{riskCount}</b></div>
          <div className="muted">Incidenter: <b>{incidentCount}</b></div>
          <div className="muted">Öppna åtgärder: <b>{openActions}</b></div>
          <div className="muted">Senaste uppföljning: <b>{lastReview}</b></div>
        </div>
      </div>

      <div className="card" style={{marginTop:14}}>
        <div className="h2">Beviskedja (audit trail)</div>
        <div className="muted">Visar när dokumentation skapats/uppdaterats. Detta ger “myndighetskänsla”.</div>
        <hr />
        <table className="table">
          <thead><tr><th>Tid</th><th>Händelse</th><th>Vem</th></tr></thead>
          <tbody>
            {audit.map(a => (
              <tr key={a.id}>
                <td className="muted">{String(a.created_at).replace('T',' ').slice(0,16)}</td>
                <td><b>{a.entity}</b> {a.event}</td>
                <td className="muted">{a.actor_email || '—'}</td>
              </tr>
            ))}
            {audit.length===0 && <tr><td colSpan={3} className="muted">Ingen logg ännu.</td></tr>}
          </tbody>
        </table>
      </div>
    </AppShell>
  )
}
