# LagTrygg SAM Portal (Next.js + Supabase + Vercel)

Fokus: **superenkel SAM-dokumentation** med status, checklista, inspektionsläge och PDF-export.

## Supabase
Kör `supabase/schema.sql` i Supabase SQL Editor.

## Env
Skapa `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Lokalt
```bash
npm install
npm run dev
```

## Vercel
Push till GitHub → importera i Vercel → lägg in env vars → deploy.
