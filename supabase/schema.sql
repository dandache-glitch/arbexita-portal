-- Arbexita: minimal multi-tenant schema for SMEs
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- Companies: one owner (single-tenant per user for MVP)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Företaget',
  industry text not null default 'kontor',
  annual_review_done boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists companies_owner_unique on public.companies(owner_user_id);

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

create table if not exists public.actions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open',
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  severity text not null default 'Tillbud',
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.policies (
  company_id uuid primary key references public.companies(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.companies enable row level security;
alter table public.risks enable row level security;
alter table public.actions enable row level security;
alter table public.incidents enable row level security;
alter table public.policies enable row level security;

-- Policies: owner-only
drop policy if exists "companies_owner_all" on public.companies;
create policy "companies_owner_all" on public.companies
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "risks_owner_all" on public.risks;
create policy "risks_owner_all" on public.risks
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "actions_owner_all" on public.actions;
create policy "actions_owner_all" on public.actions
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "incidents_owner_all" on public.incidents;
create policy "incidents_owner_all" on public.incidents
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "policies_owner_all" on public.policies;
create policy "policies_owner_all" on public.policies
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());
