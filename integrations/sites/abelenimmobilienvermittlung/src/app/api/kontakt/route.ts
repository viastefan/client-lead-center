import { NextResponse } from "next/server";
import { site } from "@/data/site";
import { contactInterestLabels } from "@/data/contact";
import { saveInquiry } from "@/lib/inquiries";
import { forwardLeadToCenter } from "@/lib/lead-center";

export const runtime = "nodejs";

type ContactPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  interest?: string;
  message?: string;
  objectRef?: string;
  address?: string;
  /** Honigtopf — nur Bots füllen das Feld aus. */
  company?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };
/**
 * Einfache Drossel pro Absender. Sie gilt je Serverinstanz und ist damit kein
 * vollständiger Schutz, hält aber einfache Schleifen auf.
 */
const hits = new Map<string, number[]>();

function tooManyRequests(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);

  // Alte Einträge gelegentlich aufräumen, damit die Map nicht wächst.
  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (times.every((time) => now - time >= RATE_LIMIT.windowMs)) hits.delete(key);
    }
  }

  return recent.length > RATE_LIMIT.max;
}

export async function POST(request: Request) {
  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const { firstName, lastName, email, phone, interest, message, objectRef, address, company } = payload;

  // Bots bekommen dieselbe freundliche Antwort, ohne dass etwas passiert.
  if (company?.trim()) {
    return NextResponse.json({ success: true });
  }

  if (!firstName?.trim() || !lastName?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Bitte füllen Sie Vorname, Nachname und Nachricht aus." },
      { status: 400 }
    );
  }

  if (!email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Bitte geben Sie eine gültige E-Mail-Adresse an." }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unbekannt";

  if (tooManyRequests(ip)) {
    return NextResponse.json(
      { error: "Es sind zu viele Anfragen in kurzer Zeit eingegangen. Bitte versuchen Sie es später erneut." },
      { status: 429 }
    );
  }

  const interestLabel = interest ? contactInterestLabels[interest] ?? interest : "Nicht angegeben";

  // Zuerst ablegen: so ist die Anfrage im Panel sichtbar, auch wenn der
  // E-Mail-Versand ausfällt.
  const stored = await saveInquiry({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
    phone: phone?.trim() ?? "",
    interest: interest?.trim() || "sonstiges",
    objectRef: objectRef?.trim() ?? "",
    address: address?.trim() ?? "",
    message: message.trim(),
  });

  const clc = await forwardLeadToCenter({
    name: `${firstName.trim()} ${lastName.trim()}`.trim(),
    email: email.trim(),
    phone: phone?.trim(),
    message: message.trim(),
    source: "website",
    metadata: { interest: interestLabel, objectRef, address },
  });

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL ?? site.email;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;

  let mailed = false;

  if (apiKey && fromEmail) {
    const emailBody = [
      `Neue Anfrage über das Kontaktformular von ${site.name}`,
      "",
      `Name: ${firstName} ${lastName}`,
      `E-Mail: ${email}`,
      `Telefon: ${phone || "Nicht angegeben"}`,
      `Interessiert an: ${interestLabel}`,
      ...(objectRef ? [`Objektbezug: ${objectRef}`] : []),
      ...(address ? [`Adresse der Immobilie: ${address}`] : []),
      "",
      "Nachricht:",
      message,
    ].join("\n");

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: toEmail,
          reply_to: email,
          subject: `Neue Anfrage: ${interestLabel} — ${firstName} ${lastName}`,
          text: emailBody,
        }),
      });

      if (response.ok) {
        mailed = true;
      } else {
        console.error("Resend-Fehler:", await response.text());
      }
    } catch (error) {
      console.error("Fehler beim Senden der Kontaktanfrage:", error);
    }
  } else {
    console.warn("Kontaktformular: RESEND_API_KEY oder CONTACT_FROM_EMAIL fehlt — kein E-Mail-Versand.");
  }

  // Nur wenn beide Wege versagen, ist die Anfrage wirklich verloren.
  if (!stored && !mailed && clc.skipped !== true && !clc.ok) {
    return NextResponse.json(
      { error: "Ihre Anfrage konnte nicht übermittelt werden. Bitte rufen Sie uns kurz an." },
      { status: 503 }
    );
  }

  return NextResponse.json({ success: true });
}
