-- Connection metadata for live Vercel customer websites.
-- Allowed hosts cover custom domains, apex, www, and *.vercel.app.

alter table public.websites
  add column if not exists vercel_project text,
  add column if not exists vercel_url text,
  add column if not exists github_repo text,
  add column if not exists allowed_hosts text[] not null default '{}'::text[];

create unique index if not exists websites_vercel_project_idx
  on public.websites (vercel_project)
  where vercel_project is not null;

comment on column public.websites.vercel_project is 'Vercel project / GitHub repo slug used to match live deployments.';
comment on column public.websites.allowed_hosts is 'Hostnames allowed for Origin/Referer checks, including vercel.app and custom domains.';
