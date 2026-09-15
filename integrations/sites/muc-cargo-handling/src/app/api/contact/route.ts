import { NextResponse } from "next/server";
import { clientIp, hashIp, RateLimiter } from "@/lib/request-meta";
import {
  saveInquiry,
  inquiriesStorageReady,
  type InquirySource,
  type InquiryTopic,
} from "@/lib/inquiries";
import { notifyNewInquiry } from "@/lib/notify";
import { forwardLeadToCenter, isLeadCenterConfigured } from "@/lib/lead-center";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOPICS = new Set<InquiryTopic>(["luftfracht", "airline", "roentgen", "allgemein"]);
const SOURCES = new Set<InquirySource>(["inquiry-flow", "contact-form"]);

const MAX_MESSAGE = 2000;
const MAX_FIELD = 120;

const limiter = new RateLimiter(60_000, 5);

type Body = {
  topic?: string;
  source?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  phone?: string;
  message?: string;
  privacy?: boolean;
  /** Honeypot — muss leer bleiben */
  website?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 180;
}

function clip(value: unknown, max: number) {
  return (typeof value === "string" ? value : "").trim().slice(0, max);
}

/** Grobe Spam-Heuristik: viele Links oder Links in Namensfeldern. */
function looksLikeSpam(fields: {
  firstName: string;
  lastName: string;
  company: string;
  message: string;
}) {
  const linkRe = /\b(?:https?:\/\/|www\.)\S+/gi;
  const links = fields.message.match(linkRe) ?? [];
  if (links.length >= 4) return true;
  if (linkRe.test(fields.firstName) || linkRe.test(fields.lastName)) return true;
  if (/\[url=|\bbbcode\b|<a\s+href=/i.test(fields.message)) return true;
  return false;
}

function makeReference() {
  return `MUC-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 5)
    .toUpperCase()}`;
}

export async function POST(request: Request) {
  const ip = clientIp(request);

  const rate = limiter.check(ip);
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: "Zu viele Anfragen. Bitte kurz warten und erneut versuchen." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Ungültige Anfrage" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Ungültige Anfrage" }, { status: 400 });
  }

  // Honeypot: Bots füllen versteckte Felder. Wir antworten wie bei Erfolg,
  // ohne irgendetwas zu speichern oder zu versenden.
  if (clip(body.website, 200)) {
    return NextResponse.json({ ok: true, reference: makeReference() });
  }

  const topic = clip(body.topic, 40) as InquiryTopic;
  const sourceRaw = clip(body.source, 40) as InquirySource;
  const source: InquirySource = SOURCES.has(sourceRaw) ? sourceRaw : "contact-form";
  const firstName = clip(body.firstName, MAX_FIELD);
  const lastName = clip(body.lastName, MAX_FIELD);
  const company = clip(body.company, MAX_FIELD);
  const email = clip(body.email, 180).toLowerCase();
  const phone = clip(body.phone, 60);
  const message = clip(body.message, MAX_MESSAGE);

  // Die Nachricht ist bewusst optional: Wer nur um Rückruf bittet, soll die
  // Anfrage abschicken können, ohne sich einen Text ausdenken zu müssen.
  if (
    !TOPICS.has(topic) ||
    !firstName ||
    !lastName ||
    !email ||
    body.privacy !== true
  ) {
    return NextResponse.json(
      { ok: false, error: "Pflichtfelder fehlen oder ungültig" },
      { status: 400 },
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Ungültige E-Mail" }, { status: 400 });
  }
  if (looksLikeSpam({ firstName, lastName, company, message })) {
    // Wie Honeypot: still verwerfen.
    return NextResponse.json({ ok: true, reference: makeReference() });
  }

  const reference = makeReference();
  const createdAt = new Date();
  const name = `${firstName} ${lastName}`;

  let persisted = false;
  try {
    const result = await saveInquiry({
      reference,
      topic,
      source,
      firstName,
      lastName,
      company: company || null,
      email,
      phone: phone || null,
      message,
      ipHash: hashIp(ip),
      userAgent: clip(request.headers.get("user-agent"), 400) || null,
    });
    persisted = result.persisted;
  } catch (error) {
    console.error("[contact] persist failed", error);
  }

  let notify;
  try {
    notify = await notifyNewInquiry({
      reference,
      topic,
      name,
      company: company || null,
      email,
      phone: phone || null,
      message,
      createdAt,
      source,
    });
  } catch (error) {
    console.error("[contact] notify failed", error);
  }

  const clc = await forwardLeadToCenter({
    name,
    email,
    phone: phone || undefined,
    company: company || undefined,
    message: message || `Rückruf erbeten (${topic})`,
    source: "website",
    metadata: { topic, reference, formSource: source },
  });

  const delivered =
    persisted ||
    clc.ok === true ||
    Boolean(
      notify &&
        (notify.teamEmail === "sent" ||
          notify.webhook === "sent" ||
          notify.sms === "sent"),
    );

  const anythingConfigured =
    inquiriesStorageReady ||
    isLeadCenterConfigured() ||
    Boolean(process.env.RESEND_API_KEY || process.env.CONTACT_WEBHOOK_URL);

  const isProd =
    process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

  // In Produktion NIE Erfolg melden, wenn die Anfrage nirgends angekommen ist
  // (weder gespeichert noch zugestellt) — sonst geht sie stillschweigend
  // verloren. Lokal/Preview ohne Konfiguration: als "geloggt" durchlassen.
  if (!delivered && isProd) {
    if (!anythingConfigured) {
      console.error("[contact] PRODUCTION: kein Speicher-/Zustellkanal konfiguriert");
    }
    return NextResponse.json(
      {
        ok: false,
        error:
          "Anfragen können derzeit nicht zugestellt werden. Bitte rufen Sie uns an oder schreiben Sie eine E-Mail.",
      },
      { status: 503 },
    );
  }

  if (!anythingConfigured) {
    console.info("[contact] no delivery channel configured — logged only", {
      reference,
      topic,
      name,
      email,
    });
  }

  return NextResponse.json({ ok: true, reference, delivered });
}
