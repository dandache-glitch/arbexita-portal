# Arbexita – SAM & Compliance-portal (SaaS)

Arbexita är en SaaS-portal för små och medelstora företag i Sverige som vill vara **redo för arbetsmiljöinspektion**.

## Stack
- Next.js 14 (App Router)
- React 18 + TypeScript
- Supabase (Auth + Postgres + RLS)
- Vercel (hosting)

## Viktiga designval (för att undvika SSR-auth problem)
- **All app-auth sker client-side** via `AuthProvider` + `AuthGuard`.
- `/app/*` är skyddat på klientsidan (ingen SSR-auth/cookies krävs).
- Datakoppling görs via `CompanyProvider` som hämtar företag en gång och återanvänds.

## Funktioner
- Compliance-score 0–100% (5 obligatoriska steg)
- "Redo för inspektion"-checklista
- Riskbedömningar (Sannolikhet × Konsekvens)
- Åtgärder (deadline + status)
- Incidentrapportering (skapar uppföljningsåtgärd)
- Policy-PDF (API route, pdf-lib)
- Branschdokument

## Miljövariabler
Skapa `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
APP_BASE_URL=https://din-domän.se
```

## Supabase
Kör `supabase/schema.sql` i Supabase SQL Editor.

Schema innehåller:
- Starkare RLS (förhindrar cross-company inserts)
- Constraints för riskdata
- DB-triggers för idempotent auto-skapande av åtgärder

## Kör lokalt
```bash
npm i
npm run dev
```

## Deploy (Vercel)
1. Importera repo i Vercel
2. Lägg in env vars i Vercel Project Settings
3. Deploy

> `app/api/policy/generate` körs på `nodejs` runtime och har `Cache-Control: no-store`.
