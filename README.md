# Arbexita (Säljbar MVP)

## 1) Supabase
1. Create a new project
2. SQL Editor -> run `supabase/schema.sql`
3. Auth -> Providers -> Email:
   - For smooth testing: disable "Confirm email" (optional but recommended)
4. Project Settings -> API:
   - Copy Project URL
   - Copy anon public key

## 2) Vercel
Environment Variables (Production):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- APP_BASE_URL = https://<your-vercel-domain>

Deploy.

## 3) What you get
- Register + Login
- Compliance-score + "Redo för inspektion" checklist
- Risks (auto-actions for high risks)
- Actions (mark done, deadlines)
- Incidents (auto follow-up actions)
- Policy PDF generator
- Industry packs (docs in dashboard)
