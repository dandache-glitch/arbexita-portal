'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [mode, setMode] = useState<'login'|'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    try {
      if (!email || !password) { setMsg('Fyll i email och lösenord.'); return }
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMsg('Skapade konto! Logga in.')
        setMode('login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.href = '/'
      }
    } catch (err: any) {
      setMsg(err?.message ?? 'Något gick fel')
    }
  }

  return (
    <div style={{maxWidth:520, margin:'60px auto'}} className="card">
      <div className="brand" style={{marginBottom:12}}>
        <img src="/logo.svg" alt="LagTrygg" />
        <div>LagTrygg <small>SAM Portal</small></div>
      </div>
      <div className="h1">{mode === 'login' ? 'Logga in' : 'Skapa konto'}</div>
      <p className="muted">Myndighetsvänlig dokumentation för systematiskt arbetsmiljöarbete. Byggd för enkelhet.</p>
      {msg && <p className="badge warn">{msg}</p>}
      <form onSubmit={submit}>
        <label>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="du@foretag.se" />
        <label>Lösenord</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
        <div className="row" style={{marginTop:12}}>
          <button className="btn" type="submit">{mode === 'login' ? 'Logga in' : 'Skapa konto'}</button>
          <button className="btn secondary" type="button" onClick={()=>setMode(mode==='login'?'signup':'login')}>
            {mode === 'login' ? 'Skapa konto' : 'Jag har redan konto'}
          </button>
        </div>
      </form>
      <hr />
      <p className="muted" style={{fontSize:12}}>Obs: Verktyg för dokumentation och struktur – inte juridisk rådgivning.</p>
    </div>
  )
}
