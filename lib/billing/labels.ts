import type { DocumentKind, DocumentStatus, TemplateId } from "./types";

export function kindLabel(kind: DocumentKind): string {
  if (kind === "quote") return "Angebot";
  if (kind === "invoice") return "Rechnung";
  return "Vertrag";
}

export function kindHref(kind: DocumentKind): "/quotes" | "/invoices" | "/contracts" {
  if (kind === "quote") return "/quotes";
  if (kind === "invoice") return "/invoices";
  return "/contracts";
}

export function statusLabel(status: DocumentStatus): string {
  switch (status) {
    case "draft":
      return "Entwurf";
    case "sent":
      return "Gesendet";
    case "accepted":
      return "Angenommen";
    case "declined":
      return "Abgelehnt";
    case "invoiced":
      return "Berechnet";
    case "paid":
      return "Bezahlt";
    case "overdue":
      return "Überfällig";
    case "signed":
      return "Unterzeichnet";
    case "active":
      return "Aktiv";
    case "expired":
      return "Beendet";
    case "cancelled":
      return "Storniert";
    case "archived":
      return "Archiv";
    default:
      return status;
  }
}

export function statusTone(status: DocumentStatus): "neutral" | "success" | "warning" | "danger" {
  if (status === "paid" || status === "accepted" || status === "signed" || status === "active") return "success";
  if (status === "overdue" || status === "declined" || status === "expired" || status === "cancelled") return "danger";
  if (status === "sent" || status === "invoiced") return "warning";
  return "neutral";
}

export const TEMPLATE_META: Record<TemplateId, { name: string; note: string }> = {
  atelier: { name: "Atelier", note: "Helles Papier, viel Weißraum, seriös." },
  linear: { name: "Linear", note: "Klares Raster, Mono-Beträge, Operations." },
  noir: { name: "Noir", note: "Dunkles Studio, 2030, für den Screen." },
};

export const QUOTE_STATUSES = ["draft", "sent", "accepted", "declined", "invoiced"] as const;
export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue"] as const;
export const CONTRACT_STATUSES = ["draft", "sent", "signed", "active", "expired", "cancelled"] as const;

export function dateFieldLabel(kind: DocumentKind): string {
  if (kind === "quote") return "Gültig bis";
  if (kind === "invoice") return "Fällig";
  return "Laufzeit bis";
}
