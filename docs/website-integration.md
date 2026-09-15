# Website-Integration

Kundenwebsites bleiben **eigene** Vercel-Projekte. Sie senden Kontaktformulare ausschließlich an die zentrale API dieses Repositories.

```text
Kunden-Website
  POST /api/contact          ← serverseitig, geheimer Key bleibt hier
        ↓
Client Lead Center
  POST /api/leads
        ↓
Supabase PostgreSQL
```

Der API-Key darf **niemals** im Browser-JavaScript der Kundenwebsite stehen.

## Environment Variables auf der Kundenwebsite

```bash
LEAD_API_URL=https://client-lead-center.vercel.app/api/leads
CUSTOMER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
WEBSITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
LEAD_API_KEY=clc_...
```

`LEAD_API_KEY` ist ein **Server-Secret** (ohne `NEXT_PUBLIC_`).

## Request

```http
POST /api/leads
Content-Type: application/json
x-api-key: clc_...

{
  "customerId": "...",
  "websiteId": "...",
  "name": "Max Mustermann",
  "email": "max@example.com",
  "phone": "+49 170 0000000",
  "company": "Muster GmbH",
  "message": "Ich interessiere mich für …",
  "source": "website",
  "pageUrl": "https://www.muster.de/kontakt",
  "metadata": {}
}
```

## Responses

| HTTP | Bedeutung |
|------|-----------|
| 201 | Lead gespeichert, `{ "success": true, "leadId": "..." }` |
| 400 | Ungültige Daten |
| 401 | Fehlender/falscher API-Key, inaktive Website oder Origin-Mismatch |
| 404 | Unbekannte Website |
| 413 | Payload zu groß (max. 32 KB) |
| 429 | Rate Limit |
| 500 | Serverfehler |

## Next.js App Router — serverseitige Route

`app/api/contact/route.ts` auf der **Kundenwebsite**:

```ts
import { NextRequest } from "next/server";

type ContactBody = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
  pageUrl?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ContactBody;

  const response = await fetch(process.env.LEAD_API_URL!, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.LEAD_API_KEY!,
    },
    body: JSON.stringify({
      customerId: process.env.CUSTOMER_ID,
      websiteId: process.env.WEBSITE_ID,
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      message: body.message,
      source: "website",
      pageUrl: body.pageUrl,
      metadata: {},
    }),
  });

  if (!response.ok) {
    return Response.json({ success: false }, { status: 502 });
  }

  const payload = (await response.json()) as { leadId?: string };
  return Response.json({ success: true, leadId: payload.leadId }, { status: 201 });
}
```

## Minimales Client-Beispiel

Das Formular ruft nur die **eigene** Route auf, nie die zentrale API:

```ts
export async function submitLead(input: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Anfrage konnte nicht gesendet werden.");
  }

  return response.json() as Promise<{ success: boolean; leadId?: string }>;
}
```

## Live Vercel-Websites

Diese Kundenprojekte sind im Katalog (`lib/catalog/vercel-sites.ts`) und über **Verbindungen** anbindbar:

| Kunde | Domain | Vercel | GitHub |
|-------|--------|--------|--------|
| Abelen Immobilien | www.abelen-immobilien.de | abelenimmobilienvermittlung.vercel.app | viastefan/abelenimmobilienvermittlung |
| Wassana Thai Imbiss | www.wassana-thai-imbiss.de | wassana-sepia.vercel.app | viastefan/Wassana |
| Airport Verpackungen | www.airport-verpackungen.de | avs-tau.vercel.app | viastefan/avs |
| Wasco Textil | www.wascotextil.de | wascotextil.vercel.app | viastefan/wascotextil |
| Festag | festagwebsite.vercel.app | festagwebsite.vercel.app | viastefan/festagwebsite |
| eRide Bavaria | eridebavaria.vercel.app | eridebavaria.vercel.app | viastefan/eridebavaria |
| Figura | figura-nine.vercel.app | figura-nine.vercel.app | viastefan/figura |
| MUC Cargohandling | www.muc-cargo.de | muc-cargo-handling.vercel.app | viastefan/muc-cargo-handling |

Nicht im Katalog (interne Tools): `client-lead-center`, `leqra.app`, `aistartup`, `veyra-pixel-generator`.

In der Admin-UI: **Verbindungen** → *Alle Live-Websites anbinden*. Danach Env + `app/api/contact/route.ts` in das jeweilige Kundenrepo kopieren.

Die Live-Sites enthalten bereits `lib/lead-center.ts` und rufen Client Lead Center aus ihren bestehenden Kontakt-Routen auf, sobald `LEAD_API_KEY`, `CUSTOMER_ID` und `WEBSITE_ID` in Vercel gesetzt sind. Ohne diese Variablen bleibt das bisherige Verhalten (Mail, eigenes Backend) unverändert.

## Origin-Prüfung

Wenn `Origin` oder `Referer` gesetzt sind, muss der Host zur Allowlist der Website passen: Custom Domain, Apex, `www` und das Vercel-Host inklusive Preview-URLs (`projekt-*.vercel.app`). Reine Server-zu-Server-Calls ohne diese Header sind erlaubt.

## Test mit cURL

```bash
curl -X POST "$LEAD_API_URL" \
  -H "content-type: application/json" \
  -H "x-api-key: $LEAD_API_KEY" \
  -d '{
    "customerId": "'"$CUSTOMER_ID"'",
    "websiteId": "'"$WEBSITE_ID"'",
    "name": "Test",
    "email": "test@example.com",
    "message": "Testanfrage"
  }'
```
