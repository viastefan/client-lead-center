# Client Lead Center

Internes Admin-/Operations-System für mehrere Kunden, deren Websites, Leads, Conversations und spätere Automationen.

Kundenwebsites bleiben **eigene** Vercel-Projekte. Sie senden Formulare nur an:

```text
POST /api/leads
```

Persistenz liegt in **Supabase PostgreSQL**. Dateien in **Supabase Storage**. **Kein Vercel Blob**, kein Memory-Store, kein Dateisystem als Datenbank.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Supabase (Postgres, Auth, Storage, RLS)
- Zod
- Vercel Hosting

## Supabase-Projekt

Dashboard: [fneitubfxquybvexlole](https://supabase.com/dashboard/project/fneitubfxquybvexlole)

URL:

```text
https://fneitubfxquybvexlole.supabase.co
```

## Lokale Installation

```bash
npm install
cp .env.example .env.local
```

Tragen Sie in `.env.local` ein:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (oder Publishable Key)
- `SUPABASE_SERVICE_ROLE_KEY`
- `ENCRYPTION_KEY` (beliebiger langer Zufallswert)

Keys: Supabase Dashboard → Project Settings → API.

```bash
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

## Datenbank-Migration

SQL ausführen (SQL Editor im verknüpften Projekt):

1. `supabase/migrations/20260915120000_init.sql`
2. `supabase/migrations/20260915180000_website_connection.sql`
3. optional Demo-Daten: `supabase/seed.sql`

Oder mit Supabase CLI:

```bash
npx supabase link --project-ref fneitubfxquybvexlole
npx supabase db push
psql "$DATABASE_URL" -f supabase/seed.sql
```

## Erster Administrator

1. Authentication → Users → User anlegen (E-Mail/Passwort)
2. Der erste User wird automatisch `super_admin`
3. Unter `/login` anmelden

Falls der Trigger nicht gegriffen hat:

```sql
update public.profiles
set role = 'super_admin'
where id = (select id from auth.users where email = 'you@example.com');
```

## Environment Variables

Siehe `.env.example`.

| Variable | Öffentlich? | Zweck |
|----------|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ja | Projekt-URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ja | Browser + Cookie-Session, durch RLS begrenzt |
| `SUPABASE_SERVICE_ROLE_KEY` | **nein** | Lead-API, Storage, Rate-Limit |
| `ENCRYPTION_KEY` | **nein** | spätere Mailbox-Tokens |
| `RESEND_API_KEY` | **nein** | System-Mails (später) |
| `CLAUDE_API_KEY` | **nein** | AI-Adapter (später) |
| `GOOGLE_*` / `MICROSOFT_*` | **nein** | OAuth (später) |
| `APP_URL` | nein | Canonical URL |

Niemals `SUPABASE_SERVICE_ROLE_KEY` oder Website-API-Keys mit `NEXT_PUBLIC_` prefixen.

## Seed

Die Seed-Datei ist klar als **DEMO-DATEN** markiert. Demo-API-Keys stehen in `supabase/seed.sql` (nur Entwicklung).

## Vercel Deployment

Projektname: `client-lead-center`

1. GitHub-Repo verbinden
2. Dieselben Env-Vars in Vercel setzen (Production + Preview)
3. Deployen
4. Domain später: `app.deinedomain.de`

Health: `GET /api/health`

## API

| Route | Auth |
|-------|------|
| `POST /api/leads` | `x-api-key` |
| `GET /api/health` | öffentlich |
| `GET/PATCH /api/leads`, `/api/clients`, `/api/websites` | Supabase Session |

Website-Anbindung: [docs/website-integration.md](docs/website-integration.md)

RLS: [docs/rls.md](docs/rls.md)

## Security

- API-Keys nur als SHA-256-Hash
- Mandantentrennung über `customer_id` + RLS
- Keine Mailbox-Passwörter, kein IMAP
- Kein Vercel Blob
- Öffentliche Lead-API: Zod, API-Key, Origin-Check, Rate-Limit, 32 KB Limit

## Development Workflow

```bash
npm run dev
npm run build
npm run lint
```

App (nach Vercel-Link): [https://client-lead-center.vercel.app](https://client-lead-center.vercel.app)

Verbindungen: in der Admin-UI unter **Verbindungen** alle live stehenden Vercel-Kundenwebsites anbinden, dann Env + Contact-Route ins jeweilige Kundenprojekt kopieren. Details: [docs/website-integration.md](docs/website-integration.md)
