-- ============================================
-- SECSCAN MULTI-TENANT SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- COMPANIES (tenants)
-- ============================================
create table public.companies (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique, -- URL-friendly name, e.g., "mact-pty-ltd"
  logo_url text,
  website text,
  notes text default '',

  -- Subscription fields (Stripe integration later)
  subscription_plan text default 'trial', -- 'trial', 'basic', 'pro', 'enterprise'
  subscription_status text default 'active', -- 'active', 'past_due', 'cancelled', 'trialing'
  scans_per_month integer default 10, -- limit based on plan
  scans_used_this_month integer default 0,
  trial_ends_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  company_id uuid references public.companies(id) on delete set null,

  full_name text,
  email text not null,
  avatar_url text,

  -- Roles: 'super_admin' (you), 'company_admin' (client team lead), 'company_viewer' (client staff)
  role text not null default 'company_viewer',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- SITES (belong to a company)
-- ============================================
create table public.sites (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,

  url text not null, -- e.g., "https://mact.au"
  name text, -- friendly name, e.g., "Main Website"
  notes text default '',

  -- Latest scan summary (denormalized for quick display)
  last_scan_id uuid,
  last_scan_at timestamptz,
  last_scan_grade text, -- 'A+', 'B', 'F', etc.
  last_scan_score integer,
  last_scan_findings jsonb default '{"critical":0,"high":0,"medium":0,"low":0,"info":0}',

  -- Scheduled scan settings
  scan_schedule text default 'manual', -- 'manual', 'weekly', 'monthly'
  default_scanners text[] default array['observatory','ssl','crawler'],

  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- SCANS (belong to a site, therefore to a company)
-- ============================================
create table public.scans (
  id uuid default uuid_generate_v4() primary key,
  site_id uuid references public.sites(id) on delete cascade not null,
  company_id uuid references public.companies(id) on delete cascade not null, -- denormalized for RLS
  started_by uuid references public.profiles(id) on delete set null, -- who triggered it

  url text not null, -- snapshot of the URL at scan time
  scanners text[] not null default array['observatory','ssl','crawler'],

  status text not null default 'queued', -- 'queued', 'scanning', 'analysing', 'complete', 'error'
  progress integer default 0, -- 0-100
  current_scanner text, -- which scanner is running right now

  -- Results (stored as JSONB for flexibility)
  results jsonb default '[]'::jsonb, -- array of scanner results
  analysis text, -- AI-generated markdown report

  -- Summary (denormalized for list views)
  total_findings integer default 0,
  severity_counts jsonb default '{"critical":0,"high":0,"medium":0,"low":0,"info":0}',
  grade text, -- best grade from scanners (Observatory)
  score integer, -- best score from scanners

  -- Report
  report_url text, -- URL to generated PDF report

  error text,
  duration_seconds numeric,

  created_at timestamptz default now(),
  completed_at timestamptz,
  updated_at timestamptz default now()
);

-- ============================================
-- SCAN FINDINGS (individual findings, for querying/filtering)
-- ============================================
create table public.findings (
  id uuid default uuid_generate_v4() primary key,
  scan_id uuid references public.scans(id) on delete cascade not null,
  site_id uuid references public.sites(id) on delete cascade not null,
  company_id uuid references public.companies(id) on delete cascade not null, -- denormalized for RLS

  scanner text not null, -- 'observatory', 'ssl', 'crawler', 'safe_browsing'
  severity text not null, -- 'critical', 'high', 'medium', 'low', 'info'
  type text not null, -- e.g., 'missing_security_header', 'ssl_expired'
  description text not null,
  recommendation text,

  -- Extra data varies by finding type
  metadata jsonb default '{}',

  -- Status tracking (for remediation)
  status text default 'open', -- 'open', 'acknowledged', 'fixed', 'false_positive'
  fixed_at timestamptz,

  created_at timestamptz default now()
);

-- ============================================
-- INDEXES for performance
-- ============================================
create index idx_profiles_company on public.profiles(company_id);
create index idx_sites_company on public.sites(company_id);
create index idx_scans_company on public.scans(company_id);
create index idx_scans_site on public.scans(site_id);
create index idx_scans_status on public.scans(status);
create index idx_scans_created on public.scans(created_at desc);
create index idx_findings_company on public.findings(company_id);
create index idx_findings_scan on public.findings(scan_id);
create index idx_findings_site on public.findings(site_id);
create index idx_findings_severity on public.findings(severity);
create index idx_findings_status on public.findings(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Users can only see their own company's data
-- ============================================

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.sites enable row level security;
alter table public.scans enable row level security;
alter table public.findings enable row level security;

-- Helper function: get current user's company_id
create or replace function public.get_user_company_id()
returns uuid as $$
  select company_id from public.profiles where id = auth.uid()
$$ language sql security definer stable;

-- Helper function: check if current user is super_admin
create or replace function public.is_super_admin()
returns boolean as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  )
$$ language sql security definer stable;

-- COMPANIES: super_admin sees all, others see their own
create policy "Super admin sees all companies" on public.companies
  for select using (public.is_super_admin());
create policy "Users see own company" on public.companies
  for select using (id = public.get_user_company_id());
create policy "Super admin manages companies" on public.companies
  for all using (public.is_super_admin());

-- PROFILES: super_admin sees all, others see same company
create policy "Super admin sees all profiles" on public.profiles
  for select using (public.is_super_admin());
create policy "Users see own company profiles" on public.profiles
  for select using (company_id = public.get_user_company_id());
create policy "Users update own profile" on public.profiles
  for update using (id = auth.uid());

-- SITES: super_admin sees all, others see own company
create policy "Super admin sees all sites" on public.sites
  for select using (public.is_super_admin());
create policy "Users see own company sites" on public.sites
  for select using (company_id = public.get_user_company_id());
create policy "Company admins manage sites" on public.sites
  for all using (
    company_id = public.get_user_company_id()
    and exists(
      select 1 from public.profiles
      where id = auth.uid() and role in ('super_admin', 'company_admin')
    )
  );

-- SCANS: super_admin sees all, others see own company
create policy "Super admin sees all scans" on public.scans
  for select using (public.is_super_admin());
create policy "Users see own company scans" on public.scans
  for select using (company_id = public.get_user_company_id());
create policy "Company admins manage scans" on public.scans
  for all using (
    company_id = public.get_user_company_id()
    and exists(
      select 1 from public.profiles
      where id = auth.uid() and role in ('super_admin', 'company_admin')
    )
  );

-- FINDINGS: super_admin sees all, others see own company
create policy "Super admin sees all findings" on public.findings
  for select using (public.is_super_admin());
create policy "Users see own company findings" on public.findings
  for select using (company_id = public.get_user_company_id());

-- ============================================
-- AUTO-UPDATE timestamps
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_companies_updated_at
  before update on public.companies
  for each row execute function public.update_updated_at();

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger update_sites_updated_at
  before update on public.sites
  for each row execute function public.update_updated_at();

create trigger update_scans_updated_at
  before update on public.scans
  for each row execute function public.update_updated_at();

-- ============================================
-- AUTO-CREATE profile on user signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'company_viewer'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- SEED DATA: Create your agency as first company
-- ============================================
-- NOTE: Run this AFTER you sign up. Replace YOUR_USER_ID with your auth.users id.
--
-- insert into public.companies (name, slug, website, subscription_plan, subscription_status, scans_per_month)
-- values ('Your Agency Name', 'your-agency', 'https://youragency.com', 'enterprise', 'active', 9999);
--
-- update public.profiles
-- set company_id = (select id from public.companies where slug = 'your-agency'),
--     role = 'super_admin'
-- where email = 'your@email.com';
