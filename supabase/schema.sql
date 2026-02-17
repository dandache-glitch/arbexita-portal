-- ================================
-- EXTENSIONS
-- ================================
create extension if not exists "uuid-ossp";

-- ================================
-- COMPANIES
-- ================================
create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  orgnr text,
  created_at timestamptz default now()
);

-- ================================
-- MEMBERSHIPS
-- ================================
create table if not exists public.memberships (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid not null,
  role text default 'admin',
  created_at timestamptz default now(),
  unique(company_id, user_id)
);

-- ================================
-- INVITATIONS (TEAM)
-- ================================
create table if not exists public.invitations (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade,
  email text not null,
  role text default 'editor',
  accepted boolean default false,
  created_at timestamptz default now()
);

-- ================================
-- SAM POLICY
-- ================================
create table if not exists public.sam_policy (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade,
  text text default '',
  approved boolean default false,
  approved_by text default '',
  approved_on date,
  updated_at timestamptz default now(),
  unique(company_id)
);

-- ================================
-- SAM RESPONSIBLE
-- ================================
create table if not exists public.sam_responsible (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade,
  name text default '',
  email text default '',
  phone text default '',
  updated_at timestamptz default now(),
  unique(company_id)
);

-- ================================
-- SAM RISKS
-- ================================
create table if not exists public.sam_risks (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  area text default '',
  description text default '',
  frequency text default 'ibland', -- hur ofta
  impact text default 'allvarligt', -- hur illa
  severity text default 'medium',
  measure text default '',
  owner text default '',
  due_on date,
  status text default 'open',
  created_at timestamptz default now()
);

-- ================================
-- SAM INCIDENTS
-- ================================
create table if not exists public.sam_incidents (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade,
  incident_type text default 'tillbud',
  happened_on date default current_date,
  description text not null,
  immediate_action text default '',
  owner text default '',
  created_at timestamptz default now()
);

-- ================================
-- SAM ACTIONS
-- ================================
create table if not exists public.sam_actions (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade,
  description text not null,
  owner text default '',
  due_on date,
  status text default 'open',
  created_at timestamptz default now()
);

-- ================================
-- SAM REVIEWS
-- ================================
create table if not exists public.sam_reviews (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade,
  review_date date default current_date,
  notes text default '',
  next_review_due date,
  created_at timestamptz default now()
);

-- ================================
-- MONTHLY CHECKIN
-- ================================
create table if not exists public.sam_monthly_checkins (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade,
  month text not null,
  notes text default '',
  created_at timestamptz default now(),
  unique(company_id, month)
);

-- ================================
-- AUDIT LOG (BEVISKEDJA)
-- ================================
create table if not exists public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade,
  action text,
  entity text,
  entity_id uuid,
  created_at timestamptz default now()
);

-- ================================
-- RLS
-- ================================
alter table public.companies enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.sam_policy enable row level security;
alter table public.sam_responsible enable row level security;
alter table public.sam_risks enable row level security;
alter table public.sam_incidents enable row level security;
alter table public.sam_actions enable row level security;
alter table public.sam_reviews enable row level security;
alter table public.sam_monthly_checkins enable row level security;
alter table public.audit_log enable row level security;

-- ================================
-- FUNCTION: CHECK MEMBER
-- ================================
create or replace function public.is_member(p_company uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.memberships m
    where m.company_id = p_company
      and m.user_id = auth.uid()
  );
$$;

-- ================================
-- POLICIES
-- ================================

-- Companies
create policy "company_select"
on public.companies
for select
using (public.is_member(id));

-- Memberships
create policy "membership_select"
on public.memberships
for select
using (user_id = auth.uid());

create policy "membership_insert"
on public.memberships
for insert
with check (user_id = auth.uid());

-- Invitations
create policy "invitation_select"
on public.invitations
for select
using (public.is_member(company_id));

create policy "invitation_insert"
on public.invitations
for insert
with check (public.is_member(company_id));

-- Generic policy helper
create policy "policy_select"
on public.sam_policy
for select
using (public.is_member(company_id));

create policy "policy_insert"
on public.sam_policy
for insert
with check (public.is_member(company_id));

create policy "policy_update"
on public.sam_policy
for update
using (public.is_member(company_id));

-- Repeat for all SAM tables

create policy "risks_all"
on public.sam_risks
for all
using (public.is_member(company_id))
with check (public.is_member(company_id));

create policy "incidents_all"
on public.sam_incidents
for all
using (public.is_member(company_id))
with check (public.is_member(company_id));

create policy "actions_all"
on public.sam_actions
for all
using (public.is_member(company_id))
with check (public.is_member(company_id));

create policy "reviews_all"
on public.sam_reviews
for all
using (public.is_member(company_id))
with check (public.is_member(company_id));

create policy "checkins_all"
on public.sam_monthly_checkins
for all
using (public.is_member(company_id))
with check (public.is_member(company_id));

create policy "audit_all"
on public.audit_log
for all
using (public.is_member(company_id))
with check (public.is_member(company_id));
