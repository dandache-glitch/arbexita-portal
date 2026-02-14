# Arbexita – SAM-portal (färdig MVP)

Detta repo är en deploybar portal (Next.js + Supabase) med:
- Inloggning (Supabase Auth)
- Dashboard med compliance score
- Riskbedömningar (skapa/lista/detalj)
- Åtgärdsplan (actions)
- Incidentrapportering (skapa/lista) + automatisk uppföljningsåtgärd
- Arbetsmiljöpolicy generator (PDF)

## 1) Skapa Supabase-projekt
1. Skapa ett nytt projekt i Supabase.
2. Öppna SQL Editor och kör filen `supabase/schema.sql`.
3. Sätt Environment Variables i Vercel (eller lokalt) enligt `.env.example`.

## 2) Lokalt
```bash
npm install
cp .env.example .env.local
npm run dev
```

## 3) Deploy (Vercel)
1. Importera repo i Vercel
2. Lägg in env vars:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - APP_BASE_URL (din Vercel URL)
3. Deploy

## Obs om abonnemang (499 kr/mån)
Denna MVP har prislapp i UI. Betalning kan kopplas via Stripe senare:
- Stripe checkout + webhook som uppdaterar `companies.plan_status = 'active'`
- Middleware som blockerar appen om status != active
