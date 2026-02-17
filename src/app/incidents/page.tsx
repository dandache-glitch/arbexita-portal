'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { ensureCompany } from '@/lib/bootstrapCompany'

export default function IncidentsPage() {
  const [companyId, setCompanyId] = useState('')
  const [risks, setRisks] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [form, setForm] = useState({ incident_type:'tillbud', happened_on:'', description:'', immediate_action:'', owner:'', related_risk_id:'' })

  useEffect(()=>{ (async()=>{ const c=await ensureCompany(); setCompanyId(c.companyId) })() }, [])
  useEffect(()=>{ if(!companyId) return; refresh() }, [companyId])

  async function refresh() {
    const [r,i] = await Promise.all([
      supabase.from('sam_risks').select('id,title').eq('company_id', companyId).order('created_at',{ascending:false}).limit(200),
      supabase.from('sam_incidents').select('*').eq('company_id', companyId).order('created_at',{ascending:false}).limit(200)
    ])
    setRisks(r.data ?? [])
    setItems(i.data ?? [])
  }

  async function add() {
    if (!form.description.trim()) return
    await supabase.from('sam_incidents').insert({
      company_id: companyId,
      incident_type: form.incident_type,
      happened_on: form.happened_on || new Date().toISOString().slice(0,10),
      description: form.description,
      immediate_action: form.immediate_action,
      owner: form.owner,
      related_risk_id: form.related_risk_id || null
    })
    setForm({ incident_type:'tillbud', happened_on:'', description:'', immediate_action:'', owner:'', related_risk_id:'' })
    await refresh()
  }

  async function remove(id: string) {
    await supabase.from('sam_incidents').delete().eq('id', id)
    await refresh()
  }

  return (
    <AppShell>
      <div className="row" style={{justifyContent:'space-between'}}>
        <div>
          <div className="h1">Incidenter / Tillbud</div>
          <div className="muted">Registrera det som hänt och vad ni gjorde direkt.</div>
        </div>
        <a className="btn secondary" href="/reports">Exportera PDF</a>
      </div>

      <div className="grid cols2" style={{marginTop:14}}>
        <div className="card">
          <div className="h2">Registrera</div>
          <label>Typ</label>
          <select value={form.incident_type} onChange={e=>setForm({...form, incident_type:e.target.value})}>
            <option value="tillbud">Tillbud</option>
            <option value="olycka">Olycka</option>
          </select>
          <label>Datum</label>
          <input type="date" value={form.happened_on} onChange={e=>setForm({...form, happened_on:e.target.value})} />
          <label>Vad hände?</label>
          <textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
          <label>Åtgärd direkt (valfritt)</label>
          <input value={form.immediate_action} onChange={e=>setForm({...form, immediate_action:e.target.value})} />
          <label>Ansvarig (valfritt)</label>
          <input value={form.owner} onChange={e=>setForm({...form, owner:e.target.value})} />
          <label>Koppla till risk (valfritt)</label>
          <select value={form.related_risk_id} onChange={e=>setForm({...form, related_risk_id:e.target.value})}>
            <option value="">—</option>
            {risks.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
          <button className="btn" onClick={add} style={{marginTop:10}}>Spara</button>
        </div>

        <div className="card">
          <div className="h2">Logg</div>
          <table className="table">
            <thead><tr><th>Händelse</th><th>Datum</th><th></th></tr></thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id}>
                  <td>
                    <div style={{fontWeight:1000}}>{String(i.incident_type).toUpperCase()}</div>
                    <div>{i.description}</div>
                    {i.immediate_action && <div className="muted">Direkt åtgärd: {i.immediate_action}</div>}
                  </td>
                  <td className="muted">{i.happened_on}</td>
                  <td><button className="btn danger" onClick={()=>remove(i.id)}>Ta bort</button></td>
                </tr>
              ))}
              {items.length===0 && <tr><td colSpan={3} className="muted">Inga registrerade incidenter.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
