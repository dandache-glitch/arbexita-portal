-- Arbexita (production-ready MVP)
-- Run this in Supabase SQL Editor.
--
-- Goals:
-- - Stronger RLS (prevents cross-company inserts)
-- - Data integrity constraints (risk ranges, level = p*c)
-- - Idempotent auto-actions (no duplicates)
-- - Compatible with Next.js (client-side auth) + Supabase + Vercel

create extension if not exists pgcrypto;

-- Companies: single-tenant per owner user (MVP)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Företaget',
  industry text not null default 'kontor',
  annual_review_done boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists companies_owner_unique on public.companies(owner_user_id);

-- Risks
create table if not exists public.risks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  area text not null,
  probability int not null,
  consequence int not null,
  level int not null,
  status text not null default 'open',
  notes text,
  created_at timestamptz not null default now()
);

-- Integrity for risks
alter table public.risks
  drop constraint if exists risks_probability_range,
  drop constraint if exists risks_consequence_range,
  drop constraint if exists risks_level_match;

alter table public.risks
  add constraint risks_probability_range check (probability between 1 and 5),
  add constraint risks_consequence_range check (consequence between 1 and 5),
  add constraint risks_level_match check (level = probability * consequence);

-- Actions
create table if not exists public.actions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open',
  due_date date,
  -- for idempotent auto-generated actions
  source_type text,
  source_id uuid,
  created_at timestamptz not null default now()
);

-- Prevent duplicate auto-actions per risk/incident.
-- Note: unique constraints allow multiple NULLs, so manual actions (NULL source_*) are unaffected.
alter table public.actions
  drop constraint if exists actions_source_unique;

alter table public.actions
  add constraint actions_source_unique unique(company_id, source_type, source_id);

-- Incidents
create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  severity text not null default 'Tillbud',
  description text,
  created_at timestamptz not null default now()
);

-- Policies (simple "exists" marker for compliance)
create table if not exists public.policies (
  company_id uuid primary key references public.companies(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.companies enable row level security;
alter table public.risks enable row level security;
alter table public.actions enable row level security;
alter table public.incidents enable row level security;
alter table public.policies enable row level security;

-- Helper: check that a company belongs to the current user
create or replace function public.is_company_owner(p_company_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.companies c
    where c.id = p_company_id
      and c.owner_user_id = auth.uid()
  );
$$;

-- Companies: owner-only
drop policy if exists "companies_owner_all" on public.companies;
create policy "companies_owner_all" on public.companies
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

-- Risks: owner-only + company ownership check (prevents cross-company inserts)
drop policy if exists "risks_owner_all" on public.risks;
create policy "risks_owner_all" on public.risks
for all to authenticated
using (
  owner_user_id = auth.uid()
  and public.is_company_owner(company_id)
)
with check (
  owner_user_id = auth.uid()
  and public.is_company_owner(company_id)
);

-- Actions: owner-only + company ownership check
drop policy if exists "actions_owner_all" on public.actions;
create policy "actions_owner_all" on public.actions
for all to authenticated
using (
  owner_user_id = auth.uid()
  and public.is_company_owner(company_id)
)
with check (
  owner_user_id = auth.uid()
  and public.is_company_owner(company_id)
);

-- Incidents: owner-only + company ownership check
drop policy if exists "incidents_owner_all" on public.incidents;
create policy "incidents_owner_all" on public.incidents
for all to authenticated
using (
  owner_user_id = auth.uid()
  and public.is_company_owner(company_id)
)
with check (
  owner_user_id = auth.uid()
  and public.is_company_owner(company_id)
);

-- Policies: owner-only + company ownership check
drop policy if exists "policies_owner_all" on public.policies;
create policy "policies_owner_all" on public.policies
for all to authenticated
using (
  owner_user_id = auth.uid()
  and public.is_company_owner(company_id)
)
with check (
  owner_user_id = auth.uid()
  and public.is_company_owner(company_id)
);

-- ---------------------------------------------------------------------
-- Database-side automations (idempotent)
-- ---------------------------------------------------------------------

-- Auto-create action when risk level >= 9
create or replace function public.create_action_from_risk()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.level >= 9 then
    insert into public.actions(
      company_id,
      owner_user_id,
      title,
      description,
      status,
      due_date,
      source_type,
      source_id
    ) values (
      new.company_id,
      new.owner_user_id,
      'Åtgärd: ' || new.title,
      'Automatiskt skapad från riskbedömning (risknivå ' || new.level || ').',
      'open',
      (now() + interval '14 days')::date,
      'risk',
      new.id
    )
    on conflict (company_id, source_type, source_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_risk_auto_action on public.risks;
create trigger trg_risk_auto_action
after insert on public.risks
for each row execute function public.create_action_from_risk();

-- Auto-create follow-up action on incident
create or replace function public.create_action_from_incident()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.actions(
    company_id,
    owner_user_id,
    title,
    description,
    status,
    due_date,
    source_type,
    source_id
  ) values (
    new.company_id,
    new.owner_user_id,
    'Uppföljning: ' || new.title,
    'Automatisk uppföljning skapad från incidentrapport.',
    'open',
    (now() + interval '7 days')::date,
    'incident',
    new.id
  )
  on conflict (company_id, source_type, source_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_incident_auto_action on public.incidents;
create trigger trg_incident_auto_action
after insert on public.incidents
for each row execute function public.create_action_from_incident();
