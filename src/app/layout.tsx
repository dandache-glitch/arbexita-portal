import './globals.css'
import '../styles.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LagTrygg SAM Portal',
  description: 'SAM – dokumentation, status och rapporter',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  )
}
