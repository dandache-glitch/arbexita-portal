# Arbexita – SAM-portal för struktur & dokumentation (SaaS)

Arbexita är en SaaS-portal för små och medelstora företag i Sverige som vill **arbeta strukturerat** med Systematiskt arbetsmiljöarbete (SAM):
policy, riskbedömningar, åtgärder, incidenter och årlig uppföljning – samlat på ett ställe.

**Viktigt:** Arbexita är ett mjukvaruverktyg. Vi ger inte juridisk rådgivning och vi lämnar inga garantier om att en verksamhet uppfyller alla krav.

## Stack
- Next.js 14 (App Router)
- React 18 + TypeScript
- Supabase (Auth + Postgres + RLS)
- Vercel (hosting)

## Designval (för att undvika SSR-auth problem)
- All app-auth sker **client-side** via `AuthProvider` + `AuthGuard`.
- `/app/*` skyddas på klientsidan (ingen SSR-auth/cookies krävs).
- Företagsdata laddas via `CompanyProvider` med retry/backoff (robust direkt efter signup).

## Funktioner
- Compliance-score 0–100% (stegbaserad checklista)
- Riskbedömningar (Sannolikhet × Konsekvens) + auto-åtgärd vid hög risk
- Åtgärder med deadlines + status
- Incidentrapportering + automatisk uppföljningsåtgärd
- Policy-PDF (API route, `pdf-lib`)
- Branschdokument (underlag/checklistor)

## Miljövariabler
Skapa `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
APP_BASE_URL=https://din-domän.se
```

## Supabase (viktigt)
1) Skapa ett Supabase-projekt  
2) Kör `supabase/schema.sql` i Supabase SQL Editor

Schema innehåller:
- Tabeller + constraints (dataintegritet)
- RLS som även stoppar cross-company inserts
- Triggers:
  - skapa `companies` automatiskt vid signup (långsiktigt robust)
  - auto-åtgärd vid hög risk (idempotent)
  - auto-uppföljning vid incident (idempotent)

### Auth-inställning
- Om du har **Email confirmations ON**: användaren måste bekräfta mail innan login.
- Om du vill ha **instant signup**: stäng av Email confirmations i Supabase Auth settings.

## Kör lokalt
```bash
npm i
npm run dev
```

## Deploy (Vercel)
1. Importera repo i Vercel
2. Lägg in env vars i Vercel Project Settings
3. Deploy
