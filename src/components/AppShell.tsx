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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const { data: { session }, error: sessionError } =
          await supabase.auth.getSession()

        if (sessionError) {
          setError('Session error')
          setLoading(false)
          return
        }

        if (!session) {
          window.location.href = '/login'
          return
        }

        const company = await ensureCompany()

        setCompanyName(company.companyName)
        setLoading(false)
      } catch (err: any) {
        console.error(err)
        setError(err?.message || 'Unknown error')
        setLoading(false)
      }
    })()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Laddar...</div>
  }

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Fel uppstod</h2>
        <p>{error}</p>
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
