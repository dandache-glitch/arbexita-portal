'use client'
import { useEffect, useState } from 'react'
import AppShell from '../../components/AppShell'
import { supabase } from '../../lib/supabaseClient'
import { ensureCompany } from '../../lib/bootstrapCompany'

export default function ActionsPage() {
  const [companyId, setCompanyId] = useState('')
  const [risks, setRisks] = useState<any[]>([])
  const [incidents, setIncidents] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [form, setForm] = useState({ description:'', owner:'', due_on:'', related_risk_id:'', related_incident_id:'' })

  useEffect(()=>{ (async()=>{ const c=await ensureCompany(); setCompanyId(c.companyId) })() }, [])
  useEffect(()=>{ if(!companyId) return; refresh() }, [companyId])

  async function refresh() {
    const [r,i,a] = await Promise.all([
      supabase.from('sam_risks').select('id,title').eq('company_id', companyId).order('created_at',{ascending:false}).limit(200),
      supabase.from('sam_incidents').select('id,description').eq('company_id', companyId).order('created_at',{ascending:false}).limit(200),
      supabase.from('sam_actions').select('*').eq('company_id', companyId).order('created_at',{ascending:false}).limit(300)
    ])
    setRisks(r.data ?? [])
    setIncidents(i.data ?? [])
    setItems(a.data ?? [])
  }

  async function add() {
    if (!form.description.trim()) return
    await supabase.from('sam_actions').insert({
      company_id: companyId,
      description: form.description,
      owner: form.owner,
      due_on: form.due_on || null,
      status: 'open',
      source: form.related_incident_id ? 'incident' : (form.related_risk_id ? 'risk' : 'manual'),
      related_risk_id: form.related_risk_id || null,
      related_incident_id: form.related_incident_id || null
    })
    setForm({ description:'', owner:'', due_on:'', related_risk_id:'', related_incident_id:'' })
    await refresh()
  }

  async function toggle(id: string, status: string) {
    await supabase.from('sam_actions').update({ status }).eq('id', id)
    await refresh()
  }

  return (
    <AppShell>
      <div className="row" style={{justifyContent:'space-between'}}>
        <div>
          <div className="h1">Åtgärdsplan</div>
          <div className="muted">Lista vad ni ska göra, vem som ansvarar och när det ska vara klart.</div>
        </div>
        <a className="btn secondary" href="/reports">Exportera PDF</a>
      </div>

      <div className="grid cols2" style={{marginTop:14}}>
        <div className="card">
          <div className="h2">Ny åtgärd</div>
          <label>Beskriv åtgärden</label>
          <textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
          <label>Ansvarig</label>
          <input value={form.owner} onChange={e=>setForm({...form, owner:e.target.value})} placeholder="Namn" />
          <label>Deadline (valfritt)</label>
          <input type="date" value={form.due_on} onChange={e=>setForm({...form, due_on:e.target.value})} />
          <label>Koppla (valfritt)</label>
          <select value={form.related_risk_id} onChange={e=>setForm({...form, related_risk_id:e.target.value, related_incident_id:''})}>
            <option value="">Koppla till risk</option>
            {risks.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
          <select value={form.related_incident_id} onChange={e=>setForm({...form, related_incident_id:e.target.value, related_risk_id:''})} style={{marginTop:8}}>
            <option value="">Koppla till incident</option>
            {incidents.map(i => <option key={i.id} value={i.id}>{(i.description || '').slice(0,60)}</option>)}
          </select>
          <button className="btn" onClick={add} style={{marginTop:10}}>Spara åtgärd</button>
        </div>

        <div className="card">
          <div className="h2">Plan</div>
          <table className="table">
            <thead><tr><th>Åtgärd</th><th>Deadline</th><th>Status</th></tr></thead>
            <tbody>
              {items.map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{fontWeight:1000}}>{a.description}</div>
                    <div className="muted">{a.owner ? `Ansvarig: ${a.owner}` : 'Ansvarig: -'}</div>
                  </td>
                  <td className="muted">{a.due_on || '-'}</td>
                  <td>
                    {a.status === 'open'
                      ? <button className="btn secondary" onClick={()=>toggle(a.id,'closed')}>Markera klar</button>
                      : <button className="btn secondary" onClick={()=>toggle(a.id,'open')}>Återöppna</button>
                    }
                    <div style={{marginTop:6}}><span className={'badge '+(a.status==='closed'?'ok':'warn')}>{a.status==='closed'?'KLAR':'ÖPPEN'}</span></div>
                  </td>
                </tr>
              ))}
              {items.length===0 && <tr><td colSpan={3} className="muted">Inga åtgärder ännu.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
