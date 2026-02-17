'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '../components/AppShell'
import { supabase } from '../lib/supabaseClient'
import { ensureCompany } from '../lib/bootstrapCompany'
import { samScore, badge, nextStep } from '../lib/samScoring'

function ymNow() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function daysBetween(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / 86400000)
}

export default function DashboardPage() {
  const [companyId, setCompanyId] = useState('')
  const [signals, setSignals] = useState({
    policyApproved: false,
    hasResponsible: false,
    hasRisk: false,
    hasAction: false,
    reviewFresh: false,
    monthlyFresh: false
  })

  const [checkinDone, setCheckinDone] = useState(false)
  const [checkinNotes, setCheckinNotes] = useState('')

  useEffect(() => {
    ;(async () => {
      const c = await ensureCompany()
      setCompanyId(c.companyId)
    })()
  }, [])

  useEffect(() => {
    if (!companyId) return

    ;(async () => {
      const [policy, responsible, risk, action, review, checkin] =
        await Promise.all([
          supabase
            .from('sam_policy')
            .select('approved')
            .eq('company_id', companyId)
            .maybeSingle(),

          supabase
            .from('sam_responsible')
            .select('name')
            .eq('company_id', companyId)
            .maybeSingle(),

          supabase
            .from('sam_risks')
            .select('id')
            .eq('company_id', companyId)
            .limit(1),

          supabase
            .from('sam_actions')
            .select('id')
            .eq('company_id', companyId)
            .limit(1),

          supabase
            .from('sam_reviews')
            .select('review_date')
            .eq('company_id', companyId)
            .order('review_date', { ascending: false })
            .limit(1),

          supabase
            .from('sam_monthly_checkins')
            .select('month')
            .eq('company_id', companyId)
            .eq('month', ymNow())
            .maybeSingle()
        ])

      const lastReview = review.data?.[0]?.review_date
        ? new Date(review.data[0].review_date)
        : null

      const reviewFresh = lastReview
        ? daysBetween(new Date(), lastReview) <= 365
        : false

      const monthlyFresh = !!checkin.data?.month
      setCheckinDone(monthlyFresh)

      setSignals({
        policyApproved: !!policy.data?.approved,
        hasResponsible: !!responsible.data?.name?.trim(),
        hasRisk: (risk.data?.length ?? 0) > 0,
        hasAction: (action.data?.length ?? 0) > 0,
        reviewFresh,
        monthlyFresh
      })
    })()
  }, [companyId])

  const score = useMemo(() => samScore(signals), [signals])
  const statusBadge = useMemo(() => badge(score), [score])
  const step = useMemo(() => nextStep(signals), [signals])

  async function confirmMonthly() {
    if (!companyId) return

    const { error } = await supabase
      .from('sam_monthly_checkins')
      .upsert({
        company_id: companyId,
        month: ymNow(),
        notes: checkinNotes
      })

    if (!error) {
      setCheckinDone(true)
      setSignals((prev) => ({ ...prev, monthlyFresh: true }))
    }
  }

  return (
    <AppShell>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="h1">SAM-status</div>
          <div className="muted">
            Översikt över ert systematiska arbetsmiljöarbete.
          </div>
        </div>

        <div className="stamp">
          <span className={'badge ' + statusBadge}>{score}%</span>
          <span className="muted">Compliance</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div className="h2">Nästa steg</div>
            <div className="muted">
              Följ rekommendationen för att nå 100%.
            </div>
          </div>

          <a className="btn" href={step.href}>
            {step.title}
          </a>
        </div>

        <div style={{ marginTop: 15 }} className="progress">
          <div style={{ width: `${score}%` }} />
        </div>
      </div>

      <div className="grid cols2" style={{ marginTop: 20 }}>
        <ChecklistItem
          ok={signals.policyApproved}
          text="Policy godkänd"
          href="/policy"
        />

        <ChecklistItem
          ok={signals.hasResponsible}
          text="Ansvarig utsedd"
          href="/settings"
        />

        <ChecklistItem
          ok={signals.hasRisk}
          text="Minst en risk dokumenterad"
          href="/risks"
        />

        <ChecklistItem
          ok={signals.hasAction}
          text="Åtgärdsplan skapad"
          href="/actions"
        />

        <ChecklistItem
          ok={signals.reviewFresh}
          text="Uppföljning genomförd"
          href="/review"
        />

        <ChecklistItem
          ok={signals.monthlyFresh}
          text="Månadsbekräftelse"
          href="#monthly"
        />
      </div>

      <div className="card" style={{ marginTop: 25 }} id="monthly">
        <div className="h2">Månadsbekräftelse</div>
        <div className="muted">
          Bekräfta att ni gått igenom arbetsmiljön denna månad.
        </div>

        <input
          style={{ marginTop: 10 }}
          placeholder="Valfri kommentar..."
          value={checkinNotes}
          onChange={(e) => setCheckinNotes(e.target.value)}
        />

        <button
          className="btn"
          style={{ marginTop: 12 }}
          onClick={confirmMonthly}
          disabled={checkinDone}
        >
          {checkinDone
            ? 'Bekräftad denna månad'
            : 'Bekräfta nu'}
        </button>
      </div>
    </AppShell>
  )
}

function ChecklistItem({
  ok,
  text,
  href
}: {
  ok: boolean
  text: string
  href: string
}) {
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="row">
          <span className={'badge ' + (ok ? 'ok' : 'warn')}>
            {ok ? 'KLAR' : 'SAKNAS'}
          </span>
          <span style={{ fontWeight: 600 }}>{text}</span>
        </div>

        <a className="btn secondary" href={href}>
          Öppna
        </a>
      </div>
    </div>
  )
}
