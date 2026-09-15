import { NextResponse } from "next/server";
import { forwardLeadToCenter } from "@/lib/lead-center";

export async function POST(request: Request) {
  let body: { name?: string; email?: string; message?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();
  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const clc = await forwardLeadToCenter({ name, email, message, source: "website" });
  if (clc.skipped || !clc.ok) {
    return NextResponse.json({ error: "Lead Center not configured" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, leadId: clc.leadId }, { status: 201 });
}
