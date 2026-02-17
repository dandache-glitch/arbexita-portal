'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Sidebar, { NavLinks } from './Sidebar'
import { ensureCompany } from '@/lib/bootstrapCompany'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')
  const [drawer, setDrawer] = useState(false)

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const c = await ensureCompany()
      setCompanyName(c.companyName)
      setLoading(false)
    })()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) return <div style={{padding:30}} className="muted">Laddar…</div>

  return (
    <div className="container">
      <div className="topbar">
        <button className="btn secondary" style={{width:44}} onClick={()=>setDrawer(true)}>☰</button>
        <div className="brand" style={{margin:0}}>
          <img src="/logo.svg" alt="LagTrygg" />
          <div>LagTrygg <small>SAM</small></div>
        </div>
        <button className="btn secondary" onClick={logout}>Logga ut</button>
      </div>

      <Sidebar companyName={companyName} onLogout={logout} />
      <main className="main">{children}</main>

      {drawer && (
        <div className="drawer" onClick={()=>setDrawer(false)}>
          <div className="drawerPanel" onClick={e=>e.stopPropagation()}>
            <div className="brand">
              <img src="/logo.svg" alt="LagTrygg" />
              <div>LagTrygg <small>SAM</small></div>
            </div>
            <div className="muted">{companyName}</div>
            <hr />
            <NavLinks onClick={()=>setDrawer(false)} />
            <hr />
            <button className="btn secondary" onClick={logout} style={{width:'100%'}}>Logga ut</button>
          </div>
        </div>
      )}
    </div>
  )
}
