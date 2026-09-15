# Site-Patches

Die Live-Websites bleiben eigene Repos. Dieser Ordner enthält die fertigen Dateien, die dort hineinkopiert werden.

Nach **Verbindungen → Alle Live-Websites anbinden** in jeder Vercel-Umgebung setzen:

```bash
LEAD_API_URL=https://client-lead-center.vercel.app/api/leads
CUSTOMER_ID=
WEBSITE_ID=
LEAD_API_KEY=
```

Ohne diese Variablen ändert sich am bestehenden Versand nichts.

| Site | Dateien |
|------|---------|
| Abelen | `src/lib/lead-center.ts`, `src/app/api/kontakt/route.ts` |
| Wassana | `src/lib/lead-center.ts`, `src/app/api/contact/route.ts` |
| AVS | `src/lib/lead-center.ts`, `src/lib/inquiry.ts` |
| Wasco | `src/lib/lead-center.ts`, `src/app/api/contact/route.ts`, `src/components/InquiryForm.tsx` |
| Festag | `lib/lead-center.ts`, `app/api/contact/route.ts`, Kontaktformular |
| eRide Bavaria | `src/lib/lead-center.ts`, consultation + custom-requests |
| Figura | `lib/lead-center.ts`, `app/api/contact/route.ts` |
| MUC Cargo | `src/lib/lead-center.ts`, `src/app/api/contact/route.ts` |
