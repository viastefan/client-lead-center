import { NextResponse } from "next/server";
import { forwardLeadToCenter, isLeadCenterConfigured } from "@/lib/lead-center";

type Body = {
  first?: string;
  last?: string;
  email?: string;
  phone?: string;
  org?: string;
  message?: string;
  subject?: string;
  intent?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const first = String(body.first ?? "").trim();
  const last = String(body.last ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const org = String(body.org ?? "").trim();
  const message = String(body.message ?? "").trim();
  const intent = String(body.intent ?? "Kontaktanfrage").trim();

  if (!first || !last || !email || !message) {
    return NextResponse.json({ error: "Bitte Pflichtfelder ausfüllen." }, { status: 400 });
  }

  const clc = await forwardLeadToCenter({
    name: `${first} ${last}`,
    email,
    phone: phone || undefined,
    company: org || undefined,
    message,
    source: "website",
    metadata: { intent, subject: body.subject },
  });

  if (clc.skipped) {
    return NextResponse.json(
      { error: "Lead Center ist noch nicht konfiguriert.", fallback: "mailto" },
      { status: 503 },
    );
  }
  if (!clc.ok) {
    return NextResponse.json({ error: "Anfrage konnte nicht gesendet werden." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, leadId: clc.leadId });
}

export { isLeadCenterConfigured };
