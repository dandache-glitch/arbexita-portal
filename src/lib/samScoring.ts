export type SamSignals = {
  policyApproved: boolean
  hasResponsible: boolean
  hasRisk: boolean
  hasAction: boolean
  reviewFresh: boolean
  monthlyFresh: boolean
}
export function samScore(s: SamSignals): number {
  const items = [s.policyApproved, s.hasResponsible, s.hasRisk, s.hasAction, s.reviewFresh, s.monthlyFresh]
  return Math.round(items.filter(Boolean).length / items.length * 100)
}
export function badge(score: number): 'ok'|'warn'|'bad' {
  if (score >= 80) return 'ok'
  if (score >= 50) return 'warn'
  return 'bad'
}
export function nextStep(s: SamSignals): { title: string, href: string } {
  if (!s.policyApproved) return { title: 'Godkänn arbetsmiljöpolicy', href: '/policy' }
  if (!s.hasResponsible) return { title: 'Sätt SAM-ansvarig', href: '/settings' }
  if (!s.hasRisk) return { title: 'Lägg till första risk', href: '/risks' }
  if (!s.hasAction) return { title: 'Skapa åtgärdsplan', href: '/actions' }
  if (!s.reviewFresh) return { title: 'Gör uppföljning', href: '/review' }
  if (!s.monthlyFresh) return { title: 'Bekräfta månadsstatus', href: '/' }
  return { title: 'Exportera SAM-rapport', href: '/reports' }
}
