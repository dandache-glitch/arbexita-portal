'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabaseClient'
import { ensureCompany } from '@/lib/bootstrapCompany'

export default function ReviewPage() {
  const [companyId, setCompanyId] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))

  useEffect(()=>{ (async()=>{ const c=await ensureCompany(); setCompanyId(c.companyId) })() }, [])
  useEffect(()=>{ if(!companyId) return; refresh() }, [companyId])

  async function refresh() {
    const r = await supabase.from('sam_reviews').select('*').eq('company_id', companyId).order('review_date',{ascending:false}).limit(50)
    setItems(r.data ?? [])
  }

  async function add() {
    if (!notes.trim()) return
    const next = new Date(date); next.setFullYear(next.getFullYear()+1)
    await supabase.from('sam_reviews').insert({ company_id: companyId, review_date: date, notes, next_review_due: next.toISOString().slice(0,10) })
    setNotes('')
    await refresh()
  }

  return (
    <AppShell>
      <div className="row" style={{justifyContent:'space-between'}}>
        <div>
          <div className="h1">Uppföljning</div>
          <div className="muted">Dokumentera att ni följt upp arbetsmiljöarbetet. En kort sammanfattning räcker.</div>
        </div>
        <a className="btn secondary" href="/reports">Exportera PDF</a>
      </div>

      <div className="grid cols2" style={{marginTop:14}}>
        <div className="card">
          <div className="h2">Ny uppföljning</div>
          <label>Datum</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
          <label>Anteckningar</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} />
          <button className="btn" onClick={add} style={{marginTop:10}}>Spara</button>
        </div>
        <div className="card">
          <div className="h2">Historik</div>
          <table className="table">
            <thead><tr><th>Datum</th><th>Notering</th></tr></thead>
            <tbody>
              {items.map(r => (
                <tr key={r.id}>
                  <td className="muted">{r.review_date}</td>
                  <td>{r.notes}</td>
                </tr>
              ))}
              {items.length===0 && <tr><td colSpan={2} className="muted">Ingen uppföljning ännu.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
