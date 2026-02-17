'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { ensureCompany } from '@/lib/bootstrapCompany'
import { exportSamPdf } from '@/lib/pdf'

export default function ReportsPage() {
  const [companyId, setCompanyId] = useState('')
  const [companyName, setCompanyName] = useState('Mitt företag')
  const [orgnr, setOrgnr] = useState<string|undefined>(undefined)

  useEffect(()=>{ (async()=>{ const c=await ensureCompany(); setCompanyId(c.companyId); setCompanyName(c.companyName) })() }, [])
  useEffect(()=>{ if(!companyId) return; (async()=>{
    const c = await supabase.from('companies').select('orgnr').eq('id', companyId).maybeSingle()
    setOrgnr(c.data?.orgnr ?? undefined)
  })() }, [companyId])

  async function exportPdf() {
    const [policy, resp, risks, incidents, actions, reviews] = await Promise.all([
      supabase.from('sam_policy').select('*').eq('company_id', companyId).maybeSingle(),
      supabase.from('sam_responsible').select('*').eq('company_id', companyId).maybeSingle(),
      supabase.from('sam_risks').select('*').eq('company_id', companyId).order('created_at',{ascending:false}).limit(500),
      supabase.from('sam_incidents').select('*').eq('company_id', companyId).order('created_at',{ascending:false}).limit(500),
      supabase.from('sam_actions').select('*').eq('company_id', companyId).order('created_at',{ascending:false}).limit(500),
      supabase.from('sam_reviews').select('*').eq('company_id', companyId).order('review_date',{ascending:false}).limit(50)
    ])

    const sections = [
      { title:'1. Policy', lines:[
        `Status: ${policy.data?.approved ? 'Godkänd' : 'Ej godkänd'}`,
        `Godkänd datum: ${policy.data?.approved_on || '-'}`,
        `Godkänd av: ${policy.data?.approved_by || '-'}`,
        '',
        (policy.data?.text || '').trim() || '(Ingen text)'
      ]},
      { title:'2. Ansvar', lines:[
        `SAM-ansvarig: ${resp.data?.name || '-'}`,
        `Email: ${resp.data?.email || '-'}`,
        `Telefon: ${resp.data?.phone || '-'}`
      ]},
      { title:'3. Risker', lines:(risks.data ?? []).map((r:any, idx:number)=>
        `${idx+1}. ${r.title} ${r.area ? '('+r.area+')' : ''} • ${r.severity} • Status: ${r.status} • Deadline: ${r.due_on || '-'} • Åtgärd: ${r.measure || '-'}`
      ).concat((risks.data ?? []).length?[]:['(Inga risker)'])},
      { title:'4. Incidenter/Tillbud', lines:(incidents.data ?? []).map((i:any, idx:number)=>
        `${idx+1}. ${i.happened_on} • ${String(i.incident_type).toUpperCase()} • ${i.description} • Direkt åtgärd: ${i.immediate_action || '-'}`
      ).concat((incidents.data ?? []).length?[]:['(Inga registrerade incidenter)'])},
      { title:'5. Åtgärdsplan', lines:(actions.data ?? []).map((a:any, idx:number)=>
        `${idx+1}. ${a.description} • Ansvarig: ${a.owner || '-'} • Deadline: ${a.due_on || '-'} • Status: ${a.status}`
      ).concat((actions.data ?? []).length?[]:['(Ingen åtgärdsplan)'])},
      { title:'6. Uppföljning', lines:(reviews.data ?? []).map((r:any, idx:number)=>
        `${idx+1}. ${r.review_date} • ${r.notes}`
      ).concat((reviews.data ?? []).length?[]:['(Ingen uppföljning registrerad)'])}
    ]

    await exportSamPdf('SAM-rapport.pdf', { company: companyName, orgnr }, sections)
  }

  return (
    <AppShell>
      <div className="h1">Rapporter</div>
      <div className="muted">Ladda ner en sammanställd SAM-rapport i PDF-format.</div>

      <div className="card" style={{marginTop:14}}>
        <div className="row" style={{justifyContent:'space-between'}}>
          <div>
            <div className="h2">SAM-rapport (PDF)</div>
            <div className="muted">{companyName}{orgnr ? ` • Org.nr ${orgnr}` : ''}</div>
          </div>
          <button className="btn" onClick={exportPdf}>Ladda ner PDF</button>
        </div>
        <hr />
        <div className="muted" style={{fontSize:12}}>Tips: Godkänn policy och lägg till minst en uppföljning för bäst “myndighetsredo” intryck.</div>
      </div>
    </AppShell>
  )
}
