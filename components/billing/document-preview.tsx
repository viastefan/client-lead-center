"use client";

import { documentTotals, lineNet } from "@/lib/billing/calc";
import { formatLongDate, formatMoney } from "@/lib/billing/format";
import { kindLabel } from "@/lib/billing/labels";
import type { BusinessDocument, CompanyProfile, TemplateId } from "@/lib/billing/types";

function addressLines(company: CompanyProfile): string {
  return [company.street, `${company.zip} ${company.city}`.trim(), company.country].filter(Boolean).join("\n");
}

function senderLine(company: CompanyProfile): string {
  return [company.legalName, company.street, `${company.zip} ${company.city}`.trim()].filter(Boolean).join(" · ");
}

export function DocumentPreview({
  document: doc,
  company,
  templateId,
}: {
  document: BusinessDocument;
  company: CompanyProfile;
  templateId?: TemplateId;
}) {
  const template = templateId ?? doc.templateId;
  const totals = documentTotals(doc);
  const kind = kindLabel(doc.kind);
  const showSkonto = doc.kind === "invoice" && company.skontoPercent > 0;
  const brand = company.tradeName.trim();
  const legal = company.legalName.trim();
  const showPaymentNote = doc.kind === "invoice" && company.paymentNote && company.paymentNote !== doc.notes;
  const serviceDate = doc.serviceDate || doc.issueDate;

  return (
    <article className={`sheet sheet-${template}`} data-template={template}>
      <header className="sheet-head">
        <div>
          <p className="sheet-brand">{brand && brand !== legal ? brand : "Freiberufler"}</p>
          <p className="sheet-legal">{legal}</p>
          <p className="sheet-sender">{senderLine(company)}</p>
        </div>
        <div className="sheet-kind">
          <p>{kind}</p>
          <strong>{doc.number || "Entwurf"}</strong>
        </div>
      </header>

      <section className="sheet-parties">
        <div>
          <p className="sheet-kicker">An</p>
          <p className="sheet-name">{doc.customerName || "Kunde"}</p>
          {doc.customerContact ? <p>{doc.customerContact}</p> : null}
          {doc.customerAddress ? <p className="whitespace-pre-wrap">{doc.customerAddress}</p> : null}
          {doc.customerEmail ? <p>{doc.customerEmail}</p> : null}
          {doc.customerPhone ? <p>{doc.customerPhone}</p> : null}
          {doc.customerVatId ? <p>USt-IdNr. {doc.customerVatId}</p> : null}
        </div>
        <div className="sheet-meta">
          <div>
            <span>Datum</span>
            <strong>{formatLongDate(doc.issueDate)}</strong>
          </div>
          <div>
            <span>{doc.kind === "quote" ? "Gültig bis" : doc.kind === "contract" ? "Laufzeit bis" : "Fällig am"}</span>
            <strong>{formatLongDate(doc.dueDate)}</strong>
          </div>
          {company.vatId ? (
            <div>
              <span>USt-IdNr.</span>
              <strong>{company.vatId}</strong>
            </div>
          ) : null}
          {company.taxNumber ? (
            <div>
              <span>Steuernr.</span>
              <strong>{company.taxNumber}</strong>
            </div>
          ) : null}
          {doc.kind === "invoice" ? (
            <div>
              <span>Leistungsdatum</span>
              <strong>{formatLongDate(serviceDate)}</strong>
            </div>
          ) : null}
          {doc.status === "paid" && doc.paidAt ? (
            <div>
              <span>Bezahlt am</span>
              <strong>{formatLongDate(doc.paidAt.slice(0, 10))}</strong>
            </div>
          ) : null}
        </div>
      </section>

      {doc.intro ? <p className="sheet-intro">{doc.intro}</p> : null}

      <table className="sheet-table">
        <thead>
          <tr>
            <th>Position</th>
            <th>Menge</th>
            <th>Preis</th>
            <th>Betrag</th>
          </tr>
        </thead>
        <tbody>
          {doc.items.map((row) => (
            <tr key={row.id}>
              <td>
                <strong>{row.title || "Position"}</strong>
                {row.description ? <span>{row.description}</span> : null}
              </td>
              <td>
                {row.qty} {row.unit}
              </td>
              <td>{formatMoney(row.unitPrice, doc.currency)}</td>
              <td>{formatMoney(lineNet(row), doc.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="sheet-totals">
        <div>
          <span>Netto</span>
          <strong>{formatMoney(totals.subtotal, doc.currency)}</strong>
        </div>
        {totals.discount > 0 ? (
          <div>
            <span>Nachlass {totals.discountPercent}%</span>
            <strong>−{formatMoney(totals.discount, doc.currency)}</strong>
          </div>
        ) : null}
        <div>
          <span>MwSt. {doc.taxRate}%</span>
          <strong>{formatMoney(totals.tax, doc.currency)}</strong>
        </div>
        <div className="sheet-gross">
          <span>Gesamt</span>
          <strong>{formatMoney(totals.gross, doc.currency)}</strong>
        </div>
        {showSkonto ? (
          <div>
            <span>
              Skonto {company.skontoPercent}% / {company.skontoDays} Tage
            </span>
            <strong>{formatMoney(totals.gross * (1 - company.skontoPercent / 100), doc.currency)}</strong>
          </div>
        ) : null}
      </section>

      {doc.notes ? <p className="sheet-notes">{doc.notes}</p> : null}
      {showPaymentNote ? <p className="sheet-notes">{company.paymentNote}</p> : null}

      <footer className="sheet-foot">
        <div>
          <p className="whitespace-pre-wrap">{addressLines(company)}</p>
          {company.email ? <p>{company.email}</p> : null}
          {company.phone ? <p>{company.phone}</p> : null}
        </div>
        <div>
          {company.iban ? <p>IBAN {company.iban}</p> : null}
          {company.bic ? <p>BIC {company.bic}</p> : null}
          {company.bankName ? <p>{company.bankName}</p> : null}
          {company.register ? <p>{company.register}</p> : null}
        </div>
        <p className="sheet-thanks">{company.footer}</p>
      </footer>
    </article>
  );
}
