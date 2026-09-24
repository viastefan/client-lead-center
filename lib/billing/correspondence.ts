import { documentTotals } from "./calc";
import { formatMoney, interpolateTemplate } from "./format";
import { paymentSnapshotFor, paymentUrl } from "./payment";
import type { BusinessDocument, CompanyProfile } from "./types";

export function documentCorrespondence(
  doc: BusinessDocument,
  company: CompanyProfile,
  origin: string,
  variant: "send" | "reminder" = "send",
) {
  const totals = documentTotals(doc);
  const pay = doc.kind === "invoice" ? paymentUrl(origin, paymentSnapshotFor(doc, company)) : "";
  const kind = doc.kind === "quote" ? "Angebot" : doc.kind === "invoice" ? "Rechnung" : "Vertrag";
  const subject =
    variant === "reminder"
      ? interpolateTemplate("Zahlungserinnerung {number} – {company}", {
          number: doc.number || "Entwurf",
          company: doc.customerName || company.legalName,
        })
      : interpolateTemplate(
          doc.kind === "quote"
            ? company.quoteEmailSubject
            : doc.kind === "invoice"
              ? company.invoiceEmailSubject
              : company.contractEmailSubject,
          {
            number: doc.number || "Entwurf",
            company: doc.customerName || company.legalName,
          },
        );

  const greeting = doc.customerContact ? `Guten Tag ${doc.customerContact},` : "Guten Tag,";
  const noun = doc.kind === "quote" ? "unser Angebot" : doc.kind === "invoice" ? "unsere Rechnung" : "unseren Vertrag";
  const intro =
    variant === "reminder"
      ? `hiermit erinnern wir freundlich an die offene ${kind} ${doc.number || ""}.`.trim()
      : `anbei ${noun} ${doc.number || ""}.`.trim();

  const body = [
    greeting,
    "",
    intro,
    `Gesamtbetrag: ${formatMoney(totals.gross, doc.currency)}.`,
    doc.dueDate ? `Fällig: ${doc.dueDate}` : "",
    pay ? `Zahlungslink: ${pay}` : "",
    "",
    company.footer,
    "",
    company.legalName,
    company.street,
    `${company.zip} ${company.city}`.trim(),
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { subject, body, pay };
}
