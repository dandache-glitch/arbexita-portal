-- LagTrygg SAM Portal - Supabase schema (v1 Pro)

create extension if not exists "uuid-ossp";

-- Companies
create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  orgnr text,
  created_by uuid,
  created_at timestamptz not null default now()
);

-- Ensure columns exist (safe for rerun)
alter table public.companies add column if not exists created_by uuid;

-- Memberships
create table if not exists public.memberships (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  unique(company_id, user_id)
);

-- Invitations (team)
create table if not exists public.invitations (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  role text not null default 'member',
  invited_by uuid,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(company_id, email)
);

-- SAM Policy
create table if not exists public.sam_policy (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  text text not null default '',
  approved boolean not null default false,
  approved_by text not null default '',
  approved_on date,
  updated_at timestamptz not null default now(),
  unique(company_id)
);

-- Responsible
create table if not exists public.sam_responsible (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  updated_at timestamptz not null default now(),
  unique(company_id)
);

-- Risks (use plain-language likelihood/consequence)
create table if not exists public.sam_risks (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  area text not null default '',
  description text not null default '',
  likelihood text not null default 'ibland',      -- sällan/ibland/ofta
  consequence text not null default 'allvarligt', -- litet/allvarligt/mycket_allvarligt
  risk_level text not null default 'medium',      -- low/medium/high (computed client-side)
  measure text not null default '',
  owner text not null default '',
  due_on date,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table public.sam_risks add column if not exists likelihood text not null default 'ibland';
alter table public.sam_risks add column if not exists consequence text not null default 'allvarligt';
alter table public.sam_risks add column if not exists risk_level text not null default 'medium';

-- Incidents
create table if not exists public.sam_incidents (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  incident_type text not null default 'tillbud',
  happened_on date not null default (now()::date),
  description text not null,
  immediate_action text not null default '',
  owner text not null default '',
  related_risk_id uuid references public.sam_risks(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Actions
create table if not exists public.sam_actions (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  description text not null,
  owner text not null default '',
  due_on date,
  status text not null default 'open',
  source text not null default 'risk',
  related_risk_id uuid references public.sam_risks(id) on delete set null,
  related_incident_id uuid references public.sam_incidents(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Reviews
create table if not exists public.sam_reviews (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  review_date date not null default (now()::date),
  notes text not null default '',
  next_review_due date,
  created_at timestamptz not null default now()
);

-- Monthly check-ins
create table if not exists public.sam_monthly_checkins (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  month text not null,
  no_incidents boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique(company_id, month)
);

-- Audit log (inspektionskänsla)
create table if not exists public.sam_audit_log (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_id uuid,
  actor_email text,
  event text not null,
  entity text not null,
  entity_id uuid,
  created_at timestamptz not null default now()
);

-- ========== RLS ==========
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
alter table public.sam_audit_log enable row level security;

create or replace function public.current_email()
returns text language sql stable as $$
  select nullif(current_setting('request.jwt.claim.email', true), '');
$$;

create or replace function public.is_member(p_company uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.memberships m
    where m.company_id = p_company and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_admin(p_company uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.memberships m
    where m.company_id = p_company and m.user_id = auth.uid() and m.role = 'admin'
  );
$$;

-- Companies
drop policy if exists "companies_select_member" on public.companies;
create policy "companies_select_member" on public.companies
for select using (public.is_member(id));

drop policy if exists "companies_update_admin" on public.companies;
create policy "companies_update_admin" on public.companies
for update using (public.is_admin(id)) with check (public.is_admin(id));

-- Memberships (secure)
drop policy if exists "memberships_select_own" on public.memberships;
create policy "memberships_select_own" on public.memberships
for select using (public.is_member(company_id));

drop policy if exists "memberships_insert_self" on public.memberships;
create policy "memberships_insert_self_via_invite_or_owner" on public.memberships
for insert with check (
  user_id = auth.uid()
  and (
    exists (select 1 from public.invitations i where i.company_id = memberships.company_id and lower(i.email)=lower(public.current_email()) and i.accepted_at is null)
    or exists (select 1 from public.companies c where c.id = memberships.company_id and c.created_by = auth.uid())
  )
);

create policy "memberships_update_admin" on public.memberships
for update using (public.is_admin(company_id)) with check (public.is_admin(company_id));

create policy "memberships_delete_admin" on public.memberships
for delete using (public.is_admin(company_id));

-- Invitations
create policy "invitations_select_admin" on public.invitations
for select using (public.is_admin(company_id));

create policy "invitations_insert_admin" on public.invitations
for insert with check (public.is_admin(company_id));

create policy "invitations_update_admin" on public.invitations
for update using (public.is_admin(company_id)) with check (public.is_admin(company_id));

create policy "invitations_delete_admin" on public.invitations
for delete using (public.is_admin(company_id));

-- Generic member policies for SAM tables
do $$
declare t record;
begin
  for t in
    select tablename from pg_tables
    where schemaname='public'
      and tablename in ('sam_policy','sam_responsible','sam_risks','sam_incidents','sam_actions','sam_reviews','sam_monthly_checkins','sam_audit_log')
  loop
    execute format('drop policy if exists "%s_select_member" on public.%I;', t.tablename, t.tablename);
    execute format('drop policy if exists "%s_insert_member" on public.%I;', t.tablename, t.tablename);
    execute format('drop policy if exists "%s_update_member" on public.%I;', t.tablename, t.tablename);
    execute format('drop policy if exists "%s_delete_member" on public.%I;', t.tablename, t.tablename);

    execute format('create policy "%s_select_member" on public.%I for select using (public.is_member(company_id));', t.tablename, t.tablename);
    execute format('create policy "%s_insert_member" on public.%I for insert with check (public.is_member(company_id));', t.tablename, t.tablename);
    execute format('create policy "%s_update_member" on public.%I for update using (public.is_member(company_id)) with check (public.is_member(company_id));', t.tablename, t.tablename);
    execute format('create policy "%s_delete_member" on public.%I for delete using (public.is_member(company_id));', t.tablename, t.tablename);
  end loop;
end $$;

-- ========== Audit triggers ==========
create or replace function public.sam_audit_event(p_company uuid, p_event text, p_entity text, p_entity_id uuid)
returns void language plpgsql security definer as $$
declare
  v_actor uuid;
  v_email text;
begin
  begin
    v_actor := nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  exception when others then
    v_actor := null;
  end;
  v_email := public.current_email();
  insert into public.sam_audit_log(company_id, actor_id, actor_email, event, entity, entity_id)
  values (p_company, v_actor, v_email, p_event, p_entity, p_entity_id);
end $$;

create or replace function public.sam_audit_trigger()
returns trigger language plpgsql security definer as $$
begin
  if (tg_op = 'INSERT') then
    perform public.sam_audit_event(new.company_id, 'created', tg_table_name, new.id);
    return new;
  elsif (tg_op = 'UPDATE') then
    perform public.sam_audit_event(new.company_id, 'updated', tg_table_name, new.id);
    return new;
  elsif (tg_op = 'DELETE') then
    perform public.sam_audit_event(old.company_id, 'deleted', tg_table_name, old.id);
    return old;
  end if;
  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array ['sam_policy','sam_responsible','sam_risks','sam_incidents','sam_actions','sam_reviews','sam_monthly_checkins']
  loop
    execute format('drop trigger if exists %I_audit on public.%I;', t, t);
    execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute function public.sam_audit_trigger();', t, t);
  end loop;
end $$;
