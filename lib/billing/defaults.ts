import { demoCustomers } from "@/lib/demo/workspace";
import { newPaymentToken } from "./payment";
import type { BillingState, BusinessDocument, CompanyProfile, LineItem, Reminder } from "./types";

export const STORAGE_KEY = "clc.billing.v1";

export const DEFAULT_COMPANY: CompanyProfile = {
  legalName: "Festag",
  tradeName: "Client Lead Center",
  ownerName: "Stefan Dirnberger",
  street: "München",
  zip: "80331",
  city: "München",
  country: "Deutschland",
  email: "stefandirnberger@viawen.com",
  phone: "",
  website: "https://client-lead-center.vercel.app",
  vatId: "",
  taxNumber: "",
  register: "",
  iban: "",
  bic: "",
  bankName: "",
  taxRate: 19,
  paymentDays: 14,
  quotePrefix: "ANG",
  invoicePrefix: "RE",
  contractPrefix: "VER",
  quoteNote: "Das Angebot ist 14 Tage gültig. Alle Preise in EUR zzgl. gesetzlicher MwSt., sofern nicht anders ausgewiesen.",
  invoiceNote: "Bitte überweisen Sie den Betrag innerhalb der Zahlungsfrist unter Angabe der Rechnungsnummer. Den Zahlungslink finden Sie in der E-Mail.",
  contractNote: "Der Vertrag beginnt mit Unterzeichnung und verlängert sich um 12 Monate, wenn er nicht mit einer Frist von 30 Tagen gekündigt wird.",
  footer: "Vielen Dank für Ihr Vertrauen.",
  defaultTemplate: "atelier",
  defaultUnit: "Stück",
  skontoPercent: 0,
  skontoDays: 0,
  quoteEmailSubject: "Angebot {number} – {company}",
  invoiceEmailSubject: "Rechnung {number} – {company}",
  contractEmailSubject: "Vertrag {number} – {company}",
  paypalUrl: "",
  stripePaymentUrl: "",
  paymentNote: "Bitte überweisen Sie den Betrag oder nutzen Sie den Zahlungslink.",
};

function item(partial: Omit<LineItem, "id"> & { id?: string }): LineItem {
  return { id: partial.id ?? crypto.randomUUID(), ...partial };
}

function isoDaysFrom(base: string, days: number): string {
  const date = new Date(base);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function seedDocuments(now = "2026-09-17T09:00:00.000Z"): BusinessDocument[] {
  const customers = demoCustomers();
  const abelen = customers[0];
  const avs = customers[2] ?? customers[0];
  const issue = now.slice(0, 10);

  return [
    {
      id: "doc-quote-abelen",
      kind: "quote",
      number: "ANG-2026-0001",
      status: "sent",
      templateId: "atelier",
      customerId: abelen.id,
      customerName: abelen.company_name,
      customerContact: abelen.contact_name,
      customerEmail: abelen.contact_email,
      customerAddress: "München",
      issueDate: issue,
      dueDate: isoDaysFrom(now, 14),
      intro: "Angebot für die laufende Betreuung Ihrer Immobilien-Website inklusive Lead-Annahme.",
      notes: DEFAULT_COMPANY.quoteNote,
      taxRate: 19,
      currency: "EUR",
      items: [
        item({
          id: "item-abelen-ops",
          title: "Website Operations",
          description: "Hosting-Koordination, Formular-Anbindung und Lead-Weiterleitung.",
          qty: 1,
          unit: "Pauschale",
          unitPrice: 890,
        }),
        item({
          id: "item-abelen-api",
          title: "Lead-Center Anschluss",
          description: "Serverseitige Anbindung an Client Lead Center inkl. Allowlist.",
          qty: 1,
          unit: "Einrichtung",
          unitPrice: 450,
        }),
      ],
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
      convertedFromId: null,
      paymentToken: "payabelen01",
    },
    {
      id: "doc-invoice-avs",
      kind: "invoice",
      number: "RE-2026-0001",
      status: "sent",
      templateId: "linear",
      customerId: avs.id,
      customerName: avs.company_name,
      customerContact: avs.contact_name,
      customerEmail: avs.contact_email,
      customerAddress: "München Airport",
      issueDate: issue,
      dueDate: isoDaysFrom(now, -5),
      intro: "Rechnung für Verpackungs-Website und Lead-Routing.",
      notes: DEFAULT_COMPANY.invoiceNote,
      taxRate: 19,
      currency: "EUR",
      items: [
        item({
          id: "item-avs-retain",
          title: "Monatliche Betreuung",
          description: "Operations, Monitoring und Anfrage-Weiterleitung.",
          qty: 1,
          unit: "Monat",
          unitPrice: 620,
        }),
      ],
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
      convertedFromId: null,
      paymentToken: "payavs00001",
    },
    {
      id: "doc-contract-festag",
      kind: "contract",
      number: "VER-2026-0001",
      status: "active",
      templateId: "noir",
      customerId: (customers[4] ?? customers[0]).id,
      customerName: (customers[4] ?? customers[0]).company_name,
      customerContact: (customers[4] ?? customers[0]).contact_name,
      customerEmail: (customers[4] ?? customers[0]).contact_email,
      customerAddress: "München",
      issueDate: issue,
      dueDate: isoDaysFrom(now, 365),
      intro: "Betreuungsvertrag für Website, Leads und monatliche Operations.",
      notes: DEFAULT_COMPANY.contractNote,
      taxRate: 19,
      currency: "EUR",
      items: [
        item({
          id: "item-festag-retainer",
          title: "Jahresbetreuung",
          description: "Website, Formulare, Lead-Center und Reporting.",
          qty: 12,
          unit: "Monat",
          unitPrice: 490,
        }),
      ],
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
      convertedFromId: null,
      paymentToken: "payfestag01",
    },
  ];
}

export function seedReminders(now = "2026-09-17T09:00:00.000Z"): Reminder[] {
  return [
    {
      id: "rem-follow-abelen",
      title: "Abelen Angebot nachfassen",
      note: "Kurzer Anruf, ob das Angebot passt.",
      dueDate: now.slice(0, 10),
      status: "open",
      source: "quote",
      relatedId: "doc-quote-abelen",
      customerName: "Abelen Immobilien",
      createdAt: now,
    },
  ];
}

export function emptyBillingState(): BillingState {
  return {
    version: 1,
    company: DEFAULT_COMPANY,
    documents: seedDocuments(),
    reminders: seedReminders(),
    sequences: { quote: 1, invoice: 1, contract: 1 },
  };
}

export { newPaymentToken };

export function newLineItem(unit = DEFAULT_COMPANY.defaultUnit): LineItem {
  return {
    id: crypto.randomUUID(),
    title: "",
    description: "",
    qty: 1,
    unit,
    unitPrice: 0,
  };
}
