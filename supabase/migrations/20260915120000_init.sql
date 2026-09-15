-- Client Lead Center — initial schema, RLS, storage, and helpers
-- Project: fneitubfxquybvexlole
--
-- Apply in the Supabase SQL editor or via `supabase db push` after linking.
-- See docs/rls.md for policy documentation.

create extension if not exists pgcrypto;

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Enumerations (text + checks, so later channels/statuses stay extensible)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'client' check (role in ('super_admin', 'admin', 'client')),
  customer_id uuid,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'App roles. Authorization must use this table or auth.app_metadata — never raw_user_meta_data.';
comment on column public.profiles.role is 'super_admin and admin see all tenants. client is scoped to customer_id.';
comment on column public.profiles.customer_id is 'Required for role=client. Null for internal admins.';

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.customers is 'Tenant root. All customer-owned rows must reference customers.id.';

create table public.websites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  name text not null,
  domain text not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'error')),
  active boolean not null default true,
  api_key_hash text not null,
  last_request_at timestamptz,
  last_lead_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.websites.api_key_hash is 'SHA-256 hex of the website API key. Never store the plaintext key.';

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  website_id uuid references public.websites (id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  company text,
  message text not null,
  source text not null default 'website',
  page_url text,
  metadata jsonb,
  status text not null default 'new' check (status in ('new', 'in_progress', 'waiting', 'replied', 'qualified', 'closed', 'spam')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  channel text not null default 'website' check (channel in ('website', 'email', 'manual')),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  sender_name text,
  sender_email text,
  recipient_email text,
  subject text,
  body text not null,
  message_type text not null default 'website' check (message_type in ('website', 'email', 'ai', 'internal')),
  ai_generated boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.email_accounts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  provider text not null check (provider in ('gmail', 'microsoft')),
  email text not null,
  display_name text,
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
  encrypted_access_token text,
  encrypted_refresh_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.email_accounts.encrypted_access_token is 'Server-only. Never selected by the authenticated role.';
comment on column public.email_accounts.encrypted_refresh_token is 'Server-only. Never selected by the authenticated role.';

create table public.automations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  name text not null,
  trigger text not null,
  action text not null,
  enabled boolean not null default false,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  customer_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table public.lead_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.lead_events is 'Outbox for later automations. V1 only records events; a worker is not required yet.';

create table public.api_rate_limits (
  website_id uuid not null references public.websites (id) on delete cascade,
  bucket_start timestamptz not null,
  request_count integer not null default 0,
  primary key (website_id, bucket_start)
);

alter table public.profiles
  add constraint profiles_customer_id_fkey
  foreign key (customer_id) references public.customers (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Indexes (FKs, RLS predicates, common filters)
-- ---------------------------------------------------------------------------

create index profiles_customer_id_idx on public.profiles (customer_id);
create index profiles_role_idx on public.profiles (role);

create index customers_status_idx on public.customers (status);
create index customers_company_name_idx on public.customers (company_name);

create unique index websites_api_key_hash_idx on public.websites (api_key_hash);
create index websites_customer_id_idx on public.websites (customer_id);
create index websites_domain_idx on public.websites (domain);
create index websites_active_idx on public.websites (active);

create index leads_customer_id_created_at_idx on public.leads (customer_id, created_at desc);
create index leads_website_id_idx on public.leads (website_id);
create index leads_status_idx on public.leads (status);
create index leads_priority_idx on public.leads (priority);
create index leads_email_idx on public.leads (email);
create index leads_source_idx on public.leads (source);

create index conversations_customer_id_idx on public.conversations (customer_id);
create index conversations_lead_id_idx on public.conversations (lead_id);

create index messages_customer_id_idx on public.messages (customer_id);
create index messages_conversation_id_created_at_idx on public.messages (conversation_id, created_at);

create index email_accounts_customer_id_idx on public.email_accounts (customer_id);

create index automations_customer_id_idx on public.automations (customer_id);
create index automations_trigger_idx on public.automations (trigger) where enabled;

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_customer_id_idx on public.audit_logs (customer_id);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

create index lead_events_unprocessed_idx on public.lead_events (created_at) where processed_at is null;
create index lead_events_customer_id_idx on public.lead_events (customer_id);
create index lead_events_lead_id_idx on public.lead_events (lead_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger customers_set_updated_at before update on public.customers
  for each row execute function private.set_updated_at();
create trigger websites_set_updated_at before update on public.websites
  for each row execute function private.set_updated_at();
create trigger leads_set_updated_at before update on public.leads
  for each row execute function private.set_updated_at();
create trigger conversations_set_updated_at before update on public.conversations
  for each row execute function private.set_updated_at();
create trigger email_accounts_set_updated_at before update on public.email_accounts
  for each row execute function private.set_updated_at();
create trigger automations_set_updated_at before update on public.automations
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth helpers (SECURITY DEFINER in private schema)
-- ---------------------------------------------------------------------------

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('super_admin', 'admin')
  );
$$;

create or replace function private.current_customer_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select customer_id
  from public.profiles
  where id = auth.uid();
$$;

create or replace function private.can_access_customer(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.is_admin()
    or (
      private.current_customer_id() is not null
      and private.current_customer_id() = target
    );
$$;

grant execute on function private.is_admin() to authenticated;
grant execute on function private.current_customer_id() to authenticated;
grant execute on function private.can_access_customer(uuid) to authenticated;

create or replace function public.health_ping()
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select now();
$$;

grant execute on function public.health_ping() to anon, authenticated, service_role;

-- First user becomes super_admin; later users default to client (no tenant access).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text := 'client';
begin
  if not exists (
    select 1 from public.profiles where role in ('super_admin', 'admin')
  ) then
    assigned_role := 'super_admin';
  end if;

  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    assigned_role,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on
  public.profiles,
  public.customers,
  public.websites,
  public.leads,
  public.conversations,
  public.messages,
  public.email_accounts,
  public.automations,
  public.audit_logs,
  public.lead_events,
  public.api_rate_limits
to authenticated, service_role;

-- Token columns stay server-only (service_role / postgres).
revoke select (encrypted_access_token, encrypted_refresh_token) on public.email_accounts from authenticated;
revoke update (encrypted_access_token, encrypted_refresh_token) on public.email_accounts from authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Admin: all rows. Client: only rows for profiles.customer_id.
-- Service role bypasses RLS (used by POST /api/leads).
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.websites enable row level security;
alter table public.leads enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.email_accounts enable row level security;
alter table public.automations enable row level security;
alter table public.audit_logs enable row level security;
alter table public.lead_events enable row level security;
alter table public.api_rate_limits enable row level security;

alter table public.profiles force row level security;
alter table public.customers force row level security;
alter table public.websites force row level security;
alter table public.leads force row level security;
alter table public.conversations force row level security;
alter table public.messages force row level security;
alter table public.email_accounts force row level security;
alter table public.automations force row level security;
alter table public.audit_logs force row level security;
alter table public.lead_events force row level security;
alter table public.api_rate_limits force row level security;

-- profiles
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or private.is_admin());

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles p where p.id = auth.uid()));

create policy profiles_admin_write on public.profiles
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- customers
create policy customers_select on public.customers
  for select to authenticated
  using (private.can_access_customer(id));

create policy customers_admin_write on public.customers
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- websites
create policy websites_select on public.websites
  for select to authenticated
  using (private.can_access_customer(customer_id));

create policy websites_admin_write on public.websites
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- leads
create policy leads_select on public.leads
  for select to authenticated
  using (private.can_access_customer(customer_id));

create policy leads_admin_write on public.leads
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- conversations
create policy conversations_select on public.conversations
  for select to authenticated
  using (private.can_access_customer(customer_id));

create policy conversations_admin_write on public.conversations
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- messages
create policy messages_select on public.messages
  for select to authenticated
  using (private.can_access_customer(customer_id));

create policy messages_admin_write on public.messages
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- email_accounts
create policy email_accounts_select on public.email_accounts
  for select to authenticated
  using (private.can_access_customer(customer_id));

create policy email_accounts_admin_write on public.email_accounts
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- automations
create policy automations_select on public.automations
  for select to authenticated
  using (private.can_access_customer(customer_id));

create policy automations_admin_write on public.automations
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- audit_logs (append-only for admins; clients can read their tenant)
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (
    private.is_admin()
    or (customer_id is not null and private.can_access_customer(customer_id))
  );

create policy audit_logs_insert on public.audit_logs
  for insert to authenticated
  with check (private.is_admin() or private.can_access_customer(customer_id));

-- lead_events
create policy lead_events_select on public.lead_events
  for select to authenticated
  using (private.can_access_customer(customer_id));

create policy lead_events_admin_write on public.lead_events
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- rate limits: no client access; service role only in practice
create policy api_rate_limits_admin_select on public.api_rate_limits
  for select to authenticated
  using (private.is_admin());

-- ---------------------------------------------------------------------------
-- Storage (Supabase Storage — not Vercel Blob)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments',
  'attachments',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain']
)
on conflict (id) do nothing;

-- Path convention: {customer_id}/{lead_id}/{filename}
create policy attachments_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'attachments'
    and private.can_access_customer((split_part(name, '/', 1))::uuid)
  );

create policy attachments_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and private.is_admin()
    and private.can_access_customer((split_part(name, '/', 1))::uuid)
  );

create policy attachments_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'attachments'
    and private.is_admin()
  )
  with check (
    bucket_id = 'attachments'
    and private.is_admin()
  );

create policy attachments_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'attachments'
    and private.is_admin()
  );
