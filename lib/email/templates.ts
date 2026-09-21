export type MailPlaceholderInput = {
  company: string;
  contact: string;
  email: string;
  domain: string;
};

export type BroadcastTemplate = {
  id: string;
  label: string;
  subject: string;
  text: string;
};

export const BROADCAST_TEMPLATES: BroadcastTemplate[] = [
  {
    id: "status",
    label: "Status",
    subject: "Kurzes Update zu {company}",
    text: `Guten Tag {contact},

ein kurzes Update zu Ihrer Website {domain}: alles läuft, Anfragen kommen zentral im Lead Center an.

Wenn Sie etwas anpassen möchten (Texte, Termine, Angebote), antworten Sie einfach auf diese E-Mail.

Viele Grüße
Festag`,
  },
  {
    id: "wartung",
    label: "Wartung",
    subject: "Geplante Wartung — {company}",
    text: `Guten Tag {contact},

wir spielen in Kürze eine kleine Aktualisierung auf {domain} aus. Die Website bleibt erreichbar, in seltenen Fällen kann eine Seite ein paar Sekunden neu laden.

Sie müssen nichts tun. Bei Fragen einfach antworten.

Viele Grüße
Festag`,
  },
  {
    id: "angebot",
    label: "Angebot",
    subject: "Angebot für {company}",
    text: `Guten Tag {contact},

wir haben ein Angebot für {company} vorbereitet. Details und der nächste Schritt folgen im Lead Center bzw. als separates Dokument.

Wenn Sie Anpassungen brauchen, schreiben Sie uns direkt an diese Adresse ({email} liegt bei uns als Kontakt).

Viele Grüße
Festag`,
  },
  {
    id: "zahlung",
    label: "Zahlung",
    subject: "Zahlungshinweis für {company}",
    text: `Guten Tag {contact},

falls eine Rechnung für {company} noch offen ist, finden Sie den Betrag und den Zahlungslink in der ursprünglichen Mail. Alternativ antworten Sie einfach hier, wir schicken den Link erneut.

Vielen Dank.

Viele Grüße
Festag`,
  },
  {
    id: "blank",
    label: "Leer",
    subject: "",
    text: `Guten Tag {contact},

`,
  },
];

export function renderMailPlaceholders(template: string, input: MailPlaceholderInput): string {
  return template
    .replaceAll("{company}", input.company)
    .replaceAll("{contact}", input.contact || input.company)
    .replaceAll("{email}", input.email)
    .replaceAll("{domain}", input.domain || "—");
}

export function templateById(id: string): BroadcastTemplate {
  return BROADCAST_TEMPLATES.find((item) => item.id === id) ?? BROADCAST_TEMPLATES[0]!;
}
