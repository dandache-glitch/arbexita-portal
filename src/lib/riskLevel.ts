export type Likelihood = 'sällan'|'ibland'|'ofta'
export type Consequence = 'litet'|'allvarligt'|'mycket_allvarligt'
export type RiskLevel = 'low'|'medium'|'high'

const L: Record<Likelihood, number> = { 'sällan':1, 'ibland':2, 'ofta':3 }
const C: Record<Consequence, number> = { 'litet':1, 'allvarligt':2, 'mycket_allvarligt':3 }

export function computeRiskLevel(likelihood: Likelihood, consequence: Consequence): RiskLevel {
  const score = (L[likelihood] ?? 2) * (C[consequence] ?? 2)
  if (score >= 7) return 'high'
  if (score >= 4) return 'medium'
  return 'low'
}

export function riskLabel(level: RiskLevel): string {
  if (level === 'high') return 'RÖD'
  if (level === 'medium') return 'GUL'
  return 'GRÖN'
}

export function riskBadge(level: RiskLevel): 'bad'|'warn'|'ok' {
  if (level === 'high') return 'bad'
  if (level === 'medium') return 'warn'
  return 'ok'
}
