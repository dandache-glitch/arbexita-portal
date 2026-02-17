'use client'
import { useEffect, useMemo, useState } from 'react'
import AppShell from '../../components/AppShell'
import { supabase } from '../../lib/supabaseClient'
import { ensureCompany } from '../../lib/bootstrapCompany'
import { computeRiskLevel, riskBadge, riskLabel, type Likelihood, type Consequence } from '../../lib/riskLevel'

export default function RisksPage() {
  const [companyId, setCompanyId] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [form, setForm] = useState({
    title:'', area:'', description:'',
    likelihood:'ibland' as Likelihood,
    consequence:'allvarligt' as Consequence,
    measure:'', owner:'', due_on:'', status:'open'
  })

  useEffect(() => { (async ()=>{ const c=await ensureCompany(); setCompanyId(c.companyId) })() }, [])
  useEffect(() => { if (!companyId) return; refresh() }, [companyId])

  const level = useMemo(()=> computeRiskLevel(form.likelihood, form.consequence), [form.likelihood, form.consequence])

  async function refresh() {
    const r = await supabase.from('sam_risks').select('*').eq('company_id', companyId).order('created_at',{ascending:false}).limit(300)
    setItems(r.data ?? [])
  }

  async function add() {
    if (!form.title.trim()) return
    const risk_level = computeRiskLevel(form.likelihood, form.consequence)
    await supabase.from('sam_risks').insert({
      company_id: companyId,
      title: form.title,
      area: form.area,
      description: form.description,
      likelihood: form.likelihood,
      consequence: form.consequence,
      risk_level,
      measure: form.measure,
      owner: form.owner,
      due_on: form.due_on || null,
      status: 'open'
    })
    setForm({ title:'', area:'', description:'', likelihood:'ibland', consequence:'allvarligt', measure:'', owner:'', due_on:'', status:'open' })
    await refresh()
  }

  async function close(id: string) {
    await supabase.from('sam_risks').update({ status:'closed' }).eq('id', id)
    await refresh()
  }

  return (
    <AppShell>
      <div className="row" style={{justifyContent:'space-between'}}>
        <div>
          <div className="h1">Risker</div>
          <div className="muted">Inga svåra ord. Välj hur ofta det kan hända och hur illa det kan bli — så får du en tydlig färg.</div>
        </div>
        <a className="btn secondary" href="/reports">Exportera PDF</a>
      </div>

      <div className="grid cols2" style={{marginTop:14}}>
        <div className="card">
          <div className="h2">Lägg till risk</div>
          <label>Vad är risken?</label>
          <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="Ex: Halkrisk vid entré" />
          <label>Var finns risken? (valfritt)</label>
          <input value={form.area} onChange={e=>setForm({...form, area:e.target.value})} placeholder="Ex: Lager / Kontor" />
          <label>Beskriv kort (valfritt)</label>
          <textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="En mening räcker." />

          <div className="grid cols2" style={{marginTop:10}}>
            <div>
              <label>Hur ofta kan det hända?</label>
              <select value={form.likelihood} onChange={e=>setForm({...form, likelihood: e.target.value as Likelihood})}>
                <option value="sällan">Sällan</option>
                <option value="ibland">Ibland</option>
                <option value="ofta">Ofta</option>
              </select>
            </div>
            <div>
              <label>Hur illa kan det bli?</label>
              <select value={form.consequence} onChange={e=>setForm({...form, consequence: e.target.value as Consequence})}>
                <option value="litet">Litet</option>
                <option value="allvarligt">Allvarligt</option>
                <option value="mycket_allvarligt">Mycket allvarligt</option>
              </select>
            </div>
          </div>

          <div className="row" style={{marginTop:10}}>
            <span className={'badge '+riskBadge(level)}>{riskLabel(level)}</span>
            <span className="muted">Automatisk risknivå</span>
          </div>

          <label>Hur hanteras risken? (åtgärd)</label>
          <input value={form.measure} onChange={e=>setForm({...form, measure:e.target.value})} placeholder="Ex: Installera halkskydd" />
          <label>Ansvarig (valfritt)</label>
          <input value={form.owner} onChange={e=>setForm({...form, owner:e.target.value})} placeholder="Namn" />
          <label>Deadline (valfritt)</label>
          <input type="date" value={form.due_on} onChange={e=>setForm({...form, due_on:e.target.value})} />
          <button className="btn" onClick={add} style={{marginTop:10}}>Spara risk</button>
        </div>

        <div className="card">
          <div className="h2">Riskregister</div>
          <table className="table">
            <thead><tr><th>Risk</th><th>Nivå</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {items.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{fontWeight:1000}}>{r.title}</div>
                    <div className="muted">
                      {r.area ? `${r.area} • ` : ''}
                      {r.likelihood || '-'} / {r.consequence || '-'} • Deadline: {r.due_on || '-'}
                    </div>
                    {r.measure && <div className="muted">Åtgärd: {r.measure}</div>}
                  </td>
                  <td><span className={'badge '+riskBadge((r.risk_level || 'medium'))}>{riskLabel((r.risk_level || 'medium'))}</span></td>
                  <td><span className={'badge '+(r.status==='closed'?'ok':'warn')}>{r.status==='closed'?'STÄNGD':'ÖPPEN'}</span></td>
                  <td>{r.status!=='closed' && <button className="btn secondary" onClick={()=>close(r.id)}>Stäng</button>}</td>
                </tr>
              ))}
              {items.length===0 && <tr><td colSpan={4} className="muted">Inga risker ännu.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
