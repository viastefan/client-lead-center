import { documentTotals } from "./calc";
import { formatLongDate, formatMoney, interpolateTemplate } from "./format";
import { paymentSnapshotFor, paymentUrl } from "./payment";
import type { BusinessDocument, CompanyProfile } from "./types";

export type CorrespondenceVariant = "send" | "reminder" | "followup";

export function documentCorrespondence(
  doc: BusinessDocument,
  company: CompanyProfile,
  origin: string,
  variant: CorrespondenceVariant = "send",
) {
  const totals = documentTotals(doc);
  const pay = doc.kind === "invoice" ? paymentUrl(origin, paymentSnapshotFor(doc, company)) : "";
  const kind = doc.kind === "quote" ? "Angebot" : doc.kind === "invoice" ? "Rechnung" : "Vertrag";
  const number = doc.number || "Entwurf";
  const greeting = doc.customerContact ? `Guten Tag ${doc.customerContact},` : "Guten Tag,";

  const subject =
    variant === "reminder"
      ? interpolateTemplate("Zahlungserinnerung {number} – {company}", {
          number,
          company: doc.customerName || company.legalName,
        })
      : variant === "followup"
        ? interpolateTemplate("{kind} {number} – kurze Nachfrage", {
            kind,
            number,
            company: doc.customerName || company.legalName,
          })
        : interpolateTemplate(
            doc.kind === "quote"
              ? company.quoteEmailSubject
              : doc.kind === "invoice"
                ? company.invoiceEmailSubject
                : company.contractEmailSubject,
            {
              number,
              company: doc.customerName || company.legalName,
            },
          );

  const intro =
    variant === "reminder"
      ? `hiermit erinnere ich freundlich an die offene ${kind} ${number}.`
      : variant === "followup"
        ? `ich wollte kurz nachfragen, ob ${kind === "Angebot" ? "das Angebot" : kind === "Rechnung" ? "die Rechnung" : "der Vertrag"} ${number} noch passt oder ob etwas fehlt.`
        : doc.kind === "quote"
          ? `anbei unser Angebot ${number}.`
          : doc.kind === "invoice"
            ? `anbei unsere Rechnung ${number}.`
            : `anbei unseren Vertrag ${number}.`;

  const bank = [
    company.iban ? `IBAN ${company.iban}` : "",
    company.bic ? `BIC ${company.bic}` : "",
    company.bankName,
  ]
    .filter(Boolean)
    .join(" · ");

  const body = [
    greeting,
    "",
    intro,
    `Gesamtbetrag: ${formatMoney(totals.gross, doc.currency)}.`,
    totals.discount > 0 ? `inkl. ${totals.discountPercent}% Nachlass.` : "",
    doc.kind === "invoice" && doc.dueDate ? `Zahlungsziel: ${formatLongDate(doc.dueDate)}` : "",
    doc.kind === "quote" && doc.dueDate ? `Gültig bis: ${formatLongDate(doc.dueDate)}` : "",
    doc.kind === "contract" && doc.dueDate ? `Laufzeit bis: ${formatLongDate(doc.dueDate)}` : "",
    pay ? `Zahlungslink: ${pay}` : "",
    bank && doc.kind === "invoice" ? `Überweisung: ${bank}` : "",
    company.taxNumber && doc.kind === "invoice" ? `Steuernummer ${company.taxNumber}` : "",
    "",
    company.footer,
    "",
    company.legalName,
    company.street,
    `${company.zip} ${company.city}`.trim(),
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { subject, body, pay, kind, number, totals };
}
