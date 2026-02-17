'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/', label: 'Status' },
  { href: '/onboarding', label: 'Kom igång' },
  { href: '/policy', label: 'Policy' },
  { href: '/risks', label: 'Risker' },
  { href: '/incidents', label: 'Incidenter/Tillbud' },
  { href: '/actions', label: 'Åtgärdsplan' },
  { href: '/review', label: 'Uppföljning' },
  { href: '/reports', label: 'Rapporter' },
  { href: '/settings', label: 'Inställningar' }
]

export function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="nav">
      {nav.map(n => (
        <Link key={n.href} href={n.href} className={pathname === n.href ? 'active' : ''} onClick={onClick}>
          {n.label}
        </Link>
      ))}
      <Link href="/inspection" className={pathname === '/inspection' ? 'active' : ''} onClick={onClick}>
        Inspektionsläge
      </Link>
    </nav>
  )
}

export default function Sidebar({ companyName, onLogout }: { companyName: string, onLogout: () => void }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="/logo.svg" alt="LagTrygg" />
        <div>LagTrygg <small>SAM Portal</small></div>
      </div>
      <div className="muted">{companyName}</div>
      <hr />
      <NavLinks />
      <hr />
      <button className="btn secondary" onClick={onLogout} style={{width:'100%'}}>Logga ut</button>
      <div className="muted" style={{marginTop:10}}>Myndighetsvänlig dokumentation</div>
    </aside>
  )
}
