-- Arbexita schema (Postgres / Supabase)

create extension if not exists "uuid-ossp";

-- Companies
create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  orgnr text,
  employees int not null default 1,
  industry text,
  owner_user_id uuid not null,
  plan_status text not null default 'active', -- later: trial/canceled/past_due
  created_at timestamptz not null default now()
);

-- Risks
create table if not exists public.risks (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  area text not null,
  title text not null,
  probability int not null check (probability between 1 and 5),
  consequence int not null check (consequence between 1 and 5),
  risk_level int not null,
  responsible text,
  deadline date,
  status text not null default 'open', -- open/closed
  created_at timestamptz not null default now()
);

-- Actions
create table if not exists public.actions (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  responsible text,
  deadline date,
  status text not null default 'todo', -- todo/doing/done
  linked_risk_id uuid references public.risks(id) on delete set null,
  linked_incident_id uuid,
  created_at timestamptz not null default now()
);

-- Incidents
create table if not exists public.incidents (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  occurred_at timestamptz not null,
  type text not null, -- Olycka/Tillbud/Nära ögat
  area text not null,
  place text,
  description text not null,
  immediate_action text,
  status text not null default 'reported', -- reported/closed
  created_at timestamptz not null default now()
);

-- Policies
create table if not exists public.policies (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null default 'Arbetsmiljöpolicy',
  signed_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.companies enable row level security;
alter table public.risks enable row level security;
alter table public.actions enable row level security;
alter table public.incidents enable row level security;
alter table public.policies enable row level security;

-- Policies: Only owner_user_id can access their company and related records
create policy "companies_select_own" on public.companies
  for select using (auth.uid() = owner_user_id);

create policy "companies_insert_own" on public.companies
  for insert with check (auth.uid() = owner_user_id);

create policy "companies_update_own" on public.companies
  for update using (auth.uid() = owner_user_id);

create policy "risks_all_own_company" on public.risks
  for all using (
    exists (select 1 from public.companies c where c.id = company_id and c.owner_user_id = auth.uid())
  ) with check (
    exists (select 1 from public.companies c where c.id = company_id and c.owner_user_id = auth.uid())
  );

create policy "actions_all_own_company" on public.actions
  for all using (
    exists (select 1 from public.companies c where c.id = company_id and c.owner_user_id = auth.uid())
  ) with check (
    exists (select 1 from public.companies c where c.id = company_id and c.owner_user_id = auth.uid())
  );

create policy "incidents_all_own_company" on public.incidents
  for all using (
    exists (select 1 from public.companies c where c.id = company_id and c.owner_user_id = auth.uid())
  ) with check (
    exists (select 1 from public.companies c where c.id = company_id and c.owner_user_id = auth.uid())
  );

create policy "policies_all_own_company" on public.policies
  for all using (
    exists (select 1 from public.companies c where c.id = company_id and c.owner_user_id = auth.uid())
  ) with check (
    exists (select 1 from public.companies c where c.id = company_id and c.owner_user_id = auth.uid())
  );
