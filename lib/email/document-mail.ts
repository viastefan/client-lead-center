import { documentTotals } from "@/lib/billing/calc";
import type { CorrespondenceVariant } from "@/lib/billing/correspondence";
import { formatMoney } from "@/lib/billing/format";
import type { BusinessDocument, CompanyProfile } from "@/lib/billing/types";
import { escapeHtml } from "./html";

export function documentMailHtml(
  doc: BusinessDocument,
  company: CompanyProfile,
  body: string,
  variant: CorrespondenceVariant = "send",
): string {
  const totals = documentTotals(doc);
  const kind = doc.kind === "quote" ? "Angebot" : doc.kind === "invoice" ? "Rechnung" : "Vertrag";
  const kicker = variant === "reminder" ? "Zahlungserinnerung" : variant === "followup" ? "Nachfrage" : kind;
  const paragraphs = escapeHtml(body)
    .split(/\n{2,}/)
    .map(
      (block) =>
        `<p style="margin:0 0 14px;line-height:1.55;font-size:15px">${block.replaceAll("\n", "<br/>")}</p>`,
    )
    .join("");

  return `<!doctype html>
<html lang="de">
  <body style="margin:0;background:#0c0c0d;color:#ececee;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif">
    <div style="max-width:560px;margin:0 auto;padding:28px 16px">
      <p style="margin:0 0 16px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8a8a90">${escapeHtml(company.legalName)}</p>
      <div style="background:#141416;border:1px solid #232326;border-radius:10px;padding:24px">
        <p style="margin:0 0 18px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a8a90">${escapeHtml(kicker)}</p>
        <p style="margin:0 0 4px;font-size:22px;letter-spacing:-.03em">${escapeHtml(doc.number || "Entwurf")}</p>
        <p style="margin:0 0 18px;color:#b4b4b8">${escapeHtml(doc.customerName || "Empfänger")} · ${escapeHtml(formatMoney(totals.gross, doc.currency))}</p>
        ${paragraphs}
      </div>
    </div>
  </body>
</html>`;
}
