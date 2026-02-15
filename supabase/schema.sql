-- Arbexita (SAM portal) - Supabase schema
-- Run this in Supabase SQL Editor (in a NEW project) or adapt for an existing project.

-- Extensions
create extension if not exists "uuid-ossp";

-- =========================
-- Tables
-- =========================

create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  owner_user_id uuid not null unique,
  name text not null,
  industry text,
  annual_review_done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.risks (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  owner_user_id uuid not null,
  title text not null,
  area text,
  probability int not null,
  consequence int not null,
  level int not null,
  status text not null default 'open',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.actions (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  owner_user_id uuid not null,
  title text not null,
  description text,
  status text not null default 'open',
  due_date timestamptz,
  created_at timestamptz not null default now(),

  -- Idempotency for auto-created actions
  source_type text,
  source_id uuid
);

create unique index if not exists actions_unique_source
on public.actions (company_id, source_type, source_id)
where source_type is not null and source_id is not null;

create table if not exists public.incidents (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  owner_user_id uuid not null,
  title text not null,
  severity text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.policies (
  company_id uuid primary key references public.companies(id) on delete cascade,
  owner_user_id uuid not null,
  updated_at timestamptz not null default now()
);

-- =========================
-- Constraints (data integrity)
-- =========================
alter table public.risks
  drop constraint if exists risks_probability_range,
  drop constraint if exists risks_consequence_range,
  drop constraint if exists risks_level_match;

alter table public.risks
  add constraint risks_probability_range check (probability between 1 and 5),
  add constraint risks_consequence_range check (consequence between 1 and 5),
  add constraint risks_level_match check (level = probability * consequence);

-- =========================
-- RLS
-- =========================
alter table public.companies enable row level security;
alter table public.risks enable row level security;
alter table public.actions enable row level security;
alter table public.incidents enable row level security;
alter table public.policies enable row level security;

-- Companies: users can read/update only their own row.
drop policy if exists "companies_select_own" on public.companies;
drop policy if exists "companies_update_own" on public.companies;

create policy "companies_select_own" on public.companies
for select to authenticated
using (owner_user_id = auth.uid());

create policy "companies_update_own" on public.companies
for update to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

-- NOTE: We intentionally do NOT allow client-side inserts into companies.
-- Companies are created via an auth trigger below.

-- Helper condition: row must belong to the user's company.
-- Implemented inline via EXISTS so cross-company inserts are blocked.

drop policy if exists "risks_owner_all" on public.risks;
create policy "risks_owner_all" on public.risks
for all to authenticated
using (
  owner_user_id = auth.uid()
  and exists (
    select 1 from public.companies c
    where c.id = risks.company_id
      and c.owner_user_id = auth.uid()
  )
)
with check (
  owner_user_id = auth.uid()
  and exists (
    select 1 from public.companies c
    where c.id = risks.company_id
      and c.owner_user_id = auth.uid()
  )
);

drop policy if exists "actions_owner_all" on public.actions;
create policy "actions_owner_all" on public.actions
for all to authenticated
using (
  owner_user_id = auth.uid()
  and exists (
    select 1 from public.companies c
    where c.id = actions.company_id
      and c.owner_user_id = auth.uid()
  )
)
with check (
  owner_user_id = auth.uid()
  and exists (
    select 1 from public.companies c
    where c.id = actions.company_id
      and c.owner_user_id = auth.uid()
  )
);

drop policy if exists "incidents_owner_all" on public.incidents;
create policy "incidents_owner_all" on public.incidents
for all to authenticated
using (
  owner_user_id = auth.uid()
  and exists (
    select 1 from public.companies c
    where c.id = incidents.company_id
      and c.owner_user_id = auth.uid()
  )
)
with check (
  owner_user_id = auth.uid()
  and exists (
    select 1 from public.companies c
    where c.id = incidents.company_id
      and c.owner_user_id = auth.uid()
  )
);

drop policy if exists "policies_owner_all" on public.policies;
create policy "policies_owner_all" on public.policies
for all to authenticated
using (
  owner_user_id = auth.uid()
  and exists (
    select 1 from public.companies c
    where c.id = policies.company_id
      and c.owner_user_id = auth.uid()
  )
)
with check (
  owner_user_id = auth.uid()
  and exists (
    select 1 from public.companies c
    where c.id = policies.company_id
      and c.owner_user_id = auth.uid()
  )
);

-- =========================
-- Triggers (production-safe onboarding & idempotency)
-- =========================

-- Auto-create companies row on signup (from auth.users metadata).
create or replace function public.handle_new_user_create_company()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.companies (owner_user_id, name, industry, annual_review_done, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'company_name', 'Företaget'),
    coalesce(new.raw_user_meta_data->>'industry', 'kontor'),
    false,
    now()
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_company on auth.users;

create trigger on_auth_user_created_company
after insert on auth.users
for each row execute procedure public.handle_new_user_create_company();

-- Auto-create action for high risk (level >= 9) idempotently
create or replace function public.handle_risk_auto_action()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.level >= 9 then
    insert into public.actions (company_id, owner_user_id, title, description, status, due_date, source_type, source_id)
    values (
      new.company_id,
      new.owner_user_id,
      'Åtgärd: ' || new.title,
      'Automatiskt skapad åtgärd för risknivå ' || new.level || ' (S×K).',
      'open',
      null,
      'risk',
      new.id
    )
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_risk_created_auto_action on public.risks;

create trigger on_risk_created_auto_action
after insert on public.risks
for each row execute procedure public.handle_risk_auto_action();

-- Auto-create follow-up action for incident idempotently
create or replace function public.handle_incident_followup_action()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.actions (company_id, owner_user_id, title, description, status, due_date, source_type, source_id)
  values (
    new.company_id,
    new.owner_user_id,
    'Uppföljning: ' || new.title,
    'Automatiskt skapad uppföljningsåtgärd för incident/tillbud.',
    'open',
    null,
    'incident',
    new.id
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_incident_created_followup_action on public.incidents;

create trigger on_incident_created_followup_action
after insert on public.incidents
for each row execute procedure public.handle_incident_followup_action();
