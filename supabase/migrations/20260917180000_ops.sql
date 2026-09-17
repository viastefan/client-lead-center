-- Contracts, payment tokens, and reminders.
-- Apply after billing. Safe while the app still uses local browser storage.

alter table public.documents drop constraint if exists documents_kind_check;
alter table public.documents
  add constraint documents_kind_check check (kind in ('quote', 'invoice', 'contract'));

alter table public.documents add column if not exists payment_token text;
create unique index if not exists documents_payment_token_key
  on public.documents (payment_token)
  where payment_token is not null;

alter table public.company_settings
  add column if not exists contract_sequence integer not null default 0;

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  note text not null default '',
  due_date date not null default current_date,
  status text not null default 'open' check (status in ('open', 'done', 'snoozed')),
  source text not null default 'manual' check (source in ('manual', 'quote', 'invoice', 'contract', 'lead')),
  related_id text,
  customer_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reminders_status_due_idx on public.reminders (status, due_date);

alter table public.reminders enable row level security;

drop policy if exists reminders_admin_all on public.reminders;
create policy reminders_admin_all on public.reminders
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
