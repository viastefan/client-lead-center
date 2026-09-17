-- Billing documents for quotes and invoices.
-- Apply after init. Safe to run when the app still uses local browser storage.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete set null,
  kind text not null check (kind in ('quote', 'invoice')),
  number text not null,
  status text not null default 'draft',
  template_id text not null default 'atelier',
  customer_name text not null default '',
  customer_contact text not null default '',
  customer_email text not null default '',
  customer_address text not null default '',
  issue_date date not null default current_date,
  due_date date not null default current_date,
  intro text not null default '',
  notes text not null default '',
  tax_rate numeric(5,2) not null default 19,
  currency text not null default 'EUR',
  items jsonb not null default '[]'::jsonb,
  archived_at timestamptz,
  converted_from_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists documents_number_key on public.documents (number);
create index if not exists documents_kind_status_idx on public.documents (kind, status);
create index if not exists documents_customer_idx on public.documents (customer_id);

alter table public.documents enable row level security;

drop policy if exists documents_admin_all on public.documents;
create policy documents_admin_all on public.documents
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('super_admin', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('super_admin', 'admin')
    )
  );

create table if not exists public.company_settings (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null default '{}'::jsonb,
  quote_sequence integer not null default 0,
  invoice_sequence integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.company_settings enable row level security;

drop policy if exists company_settings_admin_all on public.company_settings;
create policy company_settings_admin_all on public.company_settings
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('super_admin', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('super_admin', 'admin')
    )
  );
