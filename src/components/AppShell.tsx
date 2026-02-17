'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { ensureCompany } from '../lib/bootstrapCompany'
import Sidebar from './Sidebar'

export default function AppShell({
  children
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/login'
        return
      }

      const c = await ensureCompany()
      setCompanyName(c.companyName)
      setLoading(false)
    })()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        Laddar...
      </div>
    )
  }

  return (
    <div className="container">
      <Sidebar companyName={companyName} onLogout={logout} />
      <main className="main">
        {children}
      </main>
    </div>
  )
}
