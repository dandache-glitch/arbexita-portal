'use client'
import { useEffect, useMemo, useState } from 'react'
import AppShell from '../../components/AppShell'
import { supabase } from '../../lib/supabaseClient'
import { ensureCompany } from '../../lib/bootstrapCompany'
import { samScore, badge, nextStep } from '../../lib/samScoring'

function ymNow() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` }
function daysBetween(a: Date, b: Date) { return Math.floor((a.getTime()-b.getTime())/86400000) }
function isPast(dateStr?: string|null) { if(!dateStr) return false; return new Date(dateStr).getTime() < new Date(new Date().toISOString().slice(0,10)).getTime() }

export default function StatusPage() {
  const [companyId, setCompanyId] = useState('')
  const [signals, setSignals] = useState({ policyApproved:false, hasResponsible:false, hasRisk:false, hasAction:false, reviewFresh:false, monthlyFresh:false })
  const [checkinNotes, setCheckinNotes] = useState('')
  const [checkinDone, setCheckinDone] = useState(false)
  const [nextDue, setNextDue] = useState<string>('—')
  const [overdue, setOverdue] = useState<number>(0)
  const [lastAudit, setLastAudit] = useState<string>('—')

  useEffect(()=>{ (async()=>{ const c=await ensureCompany(); setCompanyId(c.companyId) })() }, [])

  useEffect(() => {
    if (!companyId) return
    ;(async () => {
      const [policy, responsible, risk, action, review, checkin, actionsAll, audit] = await Promise.all([
        supabase.from('sam_policy').select('approved').eq('company_id', companyId).maybeSingle(),
        supabase.from('sam_responsible').select('name').eq('company_id', companyId).maybeSingle(),
        supabase.from('sam_risks').select('id').eq('company_id', companyId).limit(1),
        supabase.from('sam_actions').select('id').eq('company_id', companyId).limit(1),
        supabase.from('sam_reviews').select('review_date').eq('company_id', companyId).order('review_date',{ascending:false}).limit(1),
        supabase.from('sam_monthly_checkins').select('month').eq('company_id', companyId).eq('month', ymNow()).maybeSingle(),
        supabase.from('sam_actions').select('due_on,status').eq('company_id', companyId).eq('status','open').limit(500),
        supabase.from('sam_audit_log').select('created_at').eq('company_id', companyId).order('created_at',{ascending:false}).limit(1),
      ])

      const lastReview = review.data?.[0]?.review_date ? new Date(review.data[0].review_date) : null
      const reviewFresh = lastReview ? daysBetween(new Date(), lastReview) <= 365 : false
      const monthlyFresh = !!checkin.data?.month
      setCheckinDone(monthlyFresh)

      const acts = actionsAll.data ?? []
      const dated = acts.filter((a:any)=>!!a.due_on)
      const sorted = dated.sort((a:any,b:any)=> String(a.due_on).localeCompare(String(b.due_on)))
      setNextDue(sorted[0]?.due_on ?? '—')
      setOverdue(dated.filter((a:any)=> isPast(a.due_on)).length)

      setLastAudit(audit.data?.[0]?.created_at ? String(audit.data[0].created_at).slice(0,10) : '—')

      setSignals({
        policyApproved: !!policy.data?.approved,
        hasResponsible: !!(responsible.data?.name?.trim()),
        hasRisk: (risk.data?.length ?? 0) > 0,
        hasAction: (action.data?.length ?? 0) > 0,
        reviewFresh,
        monthlyFresh
      })
    })()
  }, [companyId])

  const score = useMemo(()=> samScore(signals), [signals])
  const step = useMemo(()=> nextStep(signals), [signals])
  const b = useMemo(()=> badge(score), [score])

  const verifiedText = signals.monthlyFresh ? `Verifierad denna månad (${ymNow()})` : 'Ej verifierad denna månad'

  const showOnboarding = score < 60

  async function doMonthlyCheckin() {
    if (!companyId) return
    const month = ymNow()
    const { error } = await supabase.from('sam_monthly_checkins').upsert({ company_id: companyId, month, no_incidents: true, notes: checkinNotes })
    if (!error) { setCheckinDone(true); setSignals(s=>({...s, monthlyFresh:true})) }
  }

  return (
    <AppShell>
      <div className="row" style={{justifyContent:'space-between'}}>
        <div>
          <div className="h1">SAM-status</div>
          <div className="muted">Tydligt, enkelt och redo att visas vid kontroll. Senast uppdaterad: <b>{lastAudit}</b></div>
        </div>
        <div className="stamp">
          <span className={'badge '+b}>{score}%</span>
          <span className="muted">Status</span>
        </div>
      </div>

      {showOnboarding && (
        <div className="card" style={{marginTop:14}}>
          <div className="row" style={{justifyContent:'space-between'}}>
            <div>
              <div className="h2">Snabbstart</div>
              <div className="muted">Kom igång på 90 sek och få en bra grund (mallar + policy + ansvar).</div>
            </div>
            <a className="btn" href="/onboarding">Starta wizard</a>
          </div>
        </div>
      )}

      <div className="card" style={{marginTop:14}}>
        <div className="row" style={{justifyContent:'space-between'}}>
          <div>
            <div className="h2">Myndighetsstämpel</div>
            <div className="muted">Detta är en “känsla”-funktion som gör att kunden litar på portalen.</div>
          </div>
          <span className={'badge ' + (signals.monthlyFresh ? 'ok' : 'warn')}>{verifiedText}</span>
        </div>

        <hr />

        <div className="grid cols3">
          <div className="paper">
            <div className="h2">Nästa deadline</div>
            <div className="muted">Öppna åtgärder med datum.</div>
            <div style={{fontSize:22, fontWeight:1000, marginTop:6}}>{nextDue}</div>
            {overdue > 0 && <div style={{marginTop:8}} className="badge bad">{overdue} försenade</div>}
            <div style={{marginTop:10}}><a className="btn secondary" href="/actions">Öppna åtgärdsplan</a></div>
          </div>

          <div className="paper">
            <div className="h2">Nästa steg</div>
            <div className="muted">Systemet pekar alltid på det som saknas.</div>
            <div style={{marginTop:10}}><a className="btn" href={step.href}>{step.title}</a></div>
          </div>

          <div className="paper">
            <div className="h2">Inspektionspaket</div>
            <div className="muted">Read-only vy + export.</div>
            <div className="row" style={{marginTop:10}}>
              <a className="btn secondary" href="/inspection">Inspektionsläge</a>
              <a className="btn secondary" href="/reports">PDF</a>
            </div>
          </div>
        </div>

        <hr />

        <div className="grid cols2">
          <div className="paper">
            <div className="h2">Checklista</div>
            <div className="muted">Klicka för att fylla i.</div>
            <hr />
            <Item ok={signals.policyApproved} text="Policy godkänd" href="/policy" />
            <Item ok={signals.hasResponsible} text="SAM-ansvarig utsedd" href="/settings" />
            <Item ok={signals.hasRisk} text="Minst 1 risk dokumenterad" href="/risks" />
            <Item ok={signals.hasAction} text="Åtgärdsplan finns" href="/actions" />
            <Item ok={signals.reviewFresh} text="Uppföljning gjord (12 mån)" href="/review" />
            <Item ok={signals.monthlyFresh} text="Månadsbekräftelse gjord" href="#monthly" />
          </div>

          <div className="paper" id="monthly">
            <div className="h2">Månadsbekräftelse (1 klick)</div>
            <div className="muted">Din “abonnemangsmotor”: enkel rutin som gör att kunden loggar in varje månad.</div>
            <label>Kommentar (valfritt)</label>
            <input value={checkinNotes} onChange={e=>setCheckinNotes(e.target.value)} placeholder="Ex: Rond genomförd, inga avvikelser." />
            <div className="row" style={{marginTop:10}}>
              <button className="btn" disabled={checkinDone} onClick={doMonthlyCheckin}>
                {checkinDone ? 'Bekräftad för denna månad' : 'Bekräfta nu'}
              </button>
              <a className="btn secondary" href="/incidents">Registrera incident</a>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function Item({ ok, text, href }: { ok: boolean, text: string, href: string }) {
  return (
    <div className="row" style={{justifyContent:'space-between', margin:'8px 0'}}>
      <div className="row">
        <span className={'badge ' + (ok ? 'ok' : 'warn')}>{ok ? 'KLAR' : 'SAKNAS'}</span>
        <span style={{fontWeight:1000}}>{text}</span>
      </div>
      <a className="btn secondary" href={href}>Öppna</a>
    </div>
  )
}
