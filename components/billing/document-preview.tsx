"use client";

import { documentTotals, lineNet } from "@/lib/billing/calc";
import { formatLongDate, formatMoney } from "@/lib/billing/format";
import { kindLabel } from "@/lib/billing/labels";
import type { BusinessDocument, CompanyProfile, TemplateId } from "@/lib/billing/types";

function addressLines(company: CompanyProfile): string {
  return [company.street, `${company.zip} ${company.city}`.trim(), company.country].filter(Boolean).join("\n");
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

  return (
    <article className={`sheet sheet-${template}`} data-template={template}>
      <header className="sheet-head">
        <div>
          <p className="sheet-brand">{company.tradeName || company.legalName}</p>
          <p className="sheet-legal">{company.legalName}</p>
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
        </div>
        <div className="sheet-meta">
          <div>
            <span>Datum</span>
            <strong>{formatLongDate(doc.issueDate)}</strong>
          </div>
          <div>
            <span>{doc.kind === "quote" ? "Gültig bis" : "Fällig am"}</span>
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
          <strong>{formatMoney(totals.net, doc.currency)}</strong>
        </div>
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

      <footer className="sheet-foot">
        <div>
          <p className="whitespace-pre-wrap">{addressLines(company)}</p>
          {company.ownerName ? <p>{company.ownerName}</p> : null}
          {company.email ? <p>{company.email}</p> : null}
          {company.phone ? <p>{company.phone}</p> : null}
          {company.website ? <p>{company.website.replace(/^https?:\/\//, "")}</p> : null}
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
