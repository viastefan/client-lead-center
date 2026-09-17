import { documentTotals } from "./calc";
import type { BillingState, BusinessDocument, CompanyProfile } from "./types";

export type PaymentSnapshot = {
  v: 1;
  token: string;
  number: string;
  customerName: string;
  amount: number;
  currency: "EUR";
  dueDate: string;
  iban: string;
  bic: string;
  bankName: string;
  legalName: string;
  paypalUrl: string;
  stripeUrl: string;
  note: string;
};

export function newPaymentToken(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function encodeBase64Url(value: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8").toString("base64url");
  }
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(raw: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(raw, "base64url").toString("utf8");
  }
  const padded = raw.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodePaymentSnapshot(snapshot: PaymentSnapshot): string {
  return encodeBase64Url(JSON.stringify(snapshot));
}

export function decodePaymentSnapshot(raw: string | null | undefined): PaymentSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeBase64Url(raw)) as PaymentSnapshot;
    if (parsed.v !== 1 || !parsed.token || typeof parsed.amount !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function paymentSnapshotFor(
  doc: BusinessDocument,
  company: CompanyProfile,
): PaymentSnapshot {
  return {
    v: 1,
    token: doc.paymentToken || doc.id,
    number: doc.number || "Entwurf",
    customerName: doc.customerName,
    amount: documentTotals(doc).gross,
    currency: "EUR",
    dueDate: doc.dueDate,
    iban: company.iban,
    bic: company.bic,
    bankName: company.bankName,
    legalName: company.legalName,
    paypalUrl: company.paypalUrl,
    stripeUrl: company.stripePaymentUrl,
    note: company.paymentNote,
  };
}

export function paymentPath(snapshot: PaymentSnapshot): string {
  return `/pay/${snapshot.token}?s=${encodePaymentSnapshot(snapshot)}`;
}

export function paymentUrl(origin: string, snapshot: PaymentSnapshot): string {
  return `${origin.replace(/\/$/, "")}${paymentPath(snapshot)}`;
}

export function paypalHref(paypalUrl: string, amount: number, number: string): string {
  const trimmed = paypalUrl.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    url.searchParams.set("amount", amount.toFixed(2));
    url.searchParams.set("currency_code", "EUR");
    url.searchParams.set("item_name", number);
    return url.toString();
  } catch {
    return trimmed;
  }
}

export function snapshotFromBillingJson(raw: string | null | undefined, token: string): PaymentSnapshot | null {
  if (!raw || !token) return null;
  try {
    const parsed = JSON.parse(raw) as BillingState;
    const documents = Array.isArray(parsed.documents) ? parsed.documents : [];
    const doc = documents.find((item) => item.paymentToken === token || item.id === token);
    if (!doc || !parsed.company) return null;
    return paymentSnapshotFor(doc, parsed.company);
  } catch {
    return null;
  }
}
