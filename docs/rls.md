# Row Level Security

Alle kundenbezogenen Tabellen in `public` haben RLS aktiv **und** `FORCE ROW LEVEL SECURITY`.

Der `service_role` Key umgeht RLS und wird nur serverseitig verwendet (öffentliche Lead-API, Storage-Admin, Health).

## Rollen

Gespeichert in `public.profiles.role` (nicht in `raw_user_meta_data`):

| Rolle | Zugriff |
|-------|---------|
| `super_admin` | alle Mandanten |
| `admin` | alle Mandanten |
| `client` | nur `profiles.customer_id` |

Der erste Auth-User wird automatisch `super_admin`. Weitere User starten als `client` ohne Tenant und sehen nichts, bis ihnen eine `customer_id` zugewiesen wird.

## Helper (Schema `private`)

SECURITY DEFINER Funktionen liegen nicht in `public`:

- `private.is_admin()`
- `private.current_customer_id()`
- `private.can_access_customer(uuid)`

Policies rufen diese Funktionen auf. Beispiel:

```sql
using (private.can_access_customer(customer_id))
```

Ein `GET /api/leads/:id` liefert einen Lead nur, wenn die Session Zugriff auf dessen `customer_id` hat. Die bloße Lead-ID reicht nicht.

## Tabellen

| Tabelle | SELECT | WRITE |
|---------|--------|--------|
| `profiles` | eigenes Profil oder Admin | Admin; User darf eigenes Profil nicht eskalieren |
| `customers` | eigenes `id` oder Admin | Admin |
| `websites`, `leads`, `conversations`, `messages`, `email_accounts`, `automations`, `lead_events` | `customer_id` | Admin |
| `audit_logs` | Admin oder eigenes `customer_id` | Insert für Admin/Tenant |
| `api_rate_limits` | Admin SELECT | Service Role |

## Secrets

`email_accounts.encrypted_access_token` und `encrypted_refresh_token` sind für `authenticated` nicht lesbar. Nur Service Role.

## Storage

Bucket `attachments`, privat. Pfadkonvention: `{customer_id}/{lead_id}/{filename}`.
