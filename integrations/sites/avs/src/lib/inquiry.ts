/** Shared enquiry handling for the server action and the public API route.
 *  Both entry points must behave identically — keeping the logic here is
 *  what stops one of them drifting out of sync with the other. */

import { forwardLeadToCenter } from "@/lib/lead-center";

export type InquiryFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  subject: string;
  message: string;
  transport: string;
  goods: string;
  weight: string;
  deadline: string;
  preferredContact: string;
  consent: string;
  destination: string;
  quantity: string;
  unNumber: string;
  urgency: string;
};

export type InquiryResult =
  | { ok: true; message: string }
  | { ok: false; error: string; mailto?: string; status: number };

const CONTACT_EMAIL = "info@airport-verpackungen.de";
const CONTACT_PHONE = "+49 (0)89 975 945 91";

export function readFields(get: (key: string) => string): InquiryFields {
  return {
    firstName: get("firstName"),
    lastName: get("lastName"),
    email: get("email"),
    phone: get("phone"),
    company: get("company"),
    subject: get("subject"),
    message: get("message"),
    transport: get("transport"),
    goods: get("goods"),
    weight: get("weight"),
    deadline: get("deadline"),
    preferredContact: get("preferredContact"),
    consent: get("consent"),
    destination: get("destination"),
    quantity: get("quantity"),
    unNumber: get("unNumber"),
    urgency: get("urgency"),
  };
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function bodyLines(f: InquiryFields) {
  return [
    `Name: ${f.firstName} ${f.lastName}`,
    `E-Mail: ${f.email}`,
    `Telefon: ${f.phone || "—"}`,
    `Unternehmen: ${f.company || "—"}`,
    `Rueckmeldung bevorzugt per: ${f.preferredContact || "—"}`,
    "",
    `Anliegen: ${f.subject}`,
    `Verkehrstraeger: ${f.transport || "—"}`,
    `Zielort: ${f.destination || "—"}`,
    `Art der Gueter: ${f.goods || "—"}`,
    `Gewicht / Masse: ${f.weight || "—"}`,
    `Stueckzahl: ${f.quantity || "—"}`,
    `Gefahrgut / UN-Nummer: ${f.unNumber || "—"}`,
    `Dringlichkeit: ${f.urgency || "—"}`,
    `Gewuenschter Termin: ${f.deadline || "—"}`,
    "",
    "Nachricht:",
    f.message,
  ];
}

export async function handleInquiry(
  f: InquiryFields,
  opts: { requireConsent?: boolean } = {},
): Promise<InquiryResult> {
  /* Only two things are genuinely needed: somewhere to reply to, and
     something to reply about. Everything else — name, subject, transport,
     measurements — is a convenience for us, not a hurdle for the sender.
     A packer who knows nothing yet beyond "a machine has to go to Seoul"
     must still be able to ask. */
  if (!f.email || !f.message) {
    return {
      ok: false,
      error: "Wir brauchen nur zweierlei: Ihre E-Mail und einen Satz zur Sendung.",
      status: 400,
    };
  }
  if (!isEmail(f.email)) {
    return { ok: false, error: "Bitte eine gültige E-Mail angeben.", status: 400 };
  }
  if (opts.requireConsent && !f.consent) {
    return { ok: false, error: "Bitte stimmen Sie der Datenschutzerklärung zu.", status: 400 };
  }
  if (f.preferredContact === "Telefon" && !f.phone) {
    return { ok: false, error: "Für einen Rückruf benötigen wir Ihre Telefonnummer.", status: 400 };
  }

  /* Blank optional fields must not produce "Anfrage über die Website: "
     or a nameless greeting in the inbox. */
  f = {
    ...f,
    subject: f.subject || "Allgemeine Anfrage",
    firstName: f.firstName || (f.lastName ? "" : "Ohne"),
    lastName: f.lastName || (f.firstName ? "" : "Namensangabe"),
  };

  const to = process.env.CONTACT_TO_EMAIL || CONTACT_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || "AVS Website <onboarding@resend.dev>";
  const resendKey = process.env.RESEND_API_KEY;
  const lines = bodyLines(f);

  const mailto =
    `mailto:${to}` +
    `?subject=${encodeURIComponent(`Anfrage über die Website: ${f.subject}`)}` +
    `&body=${encodeURIComponent(lines.join("\n"))}`;

  const undelivered = (error: string, status: number): InquiryResult => {
    console.error(`AVS enquiry not delivered (${error})`, { ...f, receivedAt: new Date().toISOString() });
    return { ok: false, error, mailto, status };
  };

  const leadPayload = {
    name: `${f.firstName} ${f.lastName}`.trim(),
    email: f.email,
    phone: f.phone || undefined,
    company: f.company || undefined,
    message: [f.subject, f.message].filter(Boolean).join("\n\n"),
    source: "website" as const,
    metadata: {
      transport: f.transport,
      goods: f.goods,
      destination: f.destination,
    },
  };

  if (!resendKey) {
    const clc = await forwardLeadToCenter(leadPayload);
    if (clc.ok) {
      return { ok: true, message: "Vielen Dank! Ihr Anliegen wird schnellstmöglich bearbeitet." };
    }
    return undelivered("Der automatische Versand ist nicht eingerichtet.", 503);
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: f.email,
        subject: `[AVS Anfrage] ${f.subject}`,
        text: lines.join("\n"),
      }),
    });
    if (!res.ok) {
      console.error("Resend error:", await res.text());
      const clc = await forwardLeadToCenter(leadPayload);
      if (clc.ok) {
        return { ok: true, message: "Vielen Dank! Ihr Anliegen wird schnellstmöglich bearbeitet." };
      }
      return undelivered("Der automatische Versand hat nicht funktioniert.", 502);
    }
  } catch (error) {
    console.error("Contact mail failed:", error);
    const clc = await forwardLeadToCenter(leadPayload);
    if (clc.ok) {
      return { ok: true, message: "Vielen Dank! Ihr Anliegen wird schnellstmöglich bearbeitet." };
    }
    return undelivered("Der automatische Versand hat nicht funktioniert.", 502);
  }

  await forwardLeadToCenter(leadPayload);
  return { ok: true, message: "Vielen Dank! Ihr Anliegen wird schnellstmöglich bearbeitet." };
}

export const contactFallback = { email: CONTACT_EMAIL, phone: CONTACT_PHONE };
