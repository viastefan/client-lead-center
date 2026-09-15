import { NextResponse } from "next/server";
import { forwardLeadToCenter } from "@/lib/lead-center";

export async function POST(request: Request) {
  let body: { name?: string; email?: string; message?: string; topic?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();
  if (!name || !email || !message) {
    return NextResponse.json({ error: "Bitte Name, E-Mail und Nachricht angeben." }, { status: 400 });
  }

  const clc = await forwardLeadToCenter({
    name,
    email,
    message,
    source: "website",
    metadata: { topic: body.topic },
  });

  if (clc.skipped || !clc.ok) {
    return NextResponse.json({ error: "Anfrage konnte nicht gesendet werden." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, leadId: clc.leadId }, { status: 201 });
}
