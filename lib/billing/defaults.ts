import type { BillingState, CompanyProfile, LineItem } from "./types";
import { newPaymentToken } from "./payment";

export const STORAGE_KEY = "clc.billing.v2";

export const DEFAULT_COMPANY: CompanyProfile = {
  legalName: "Stefan Dirnberger",
  tradeName: "",
  ownerName: "Stefan Dirnberger",
  street: "Lindenstr. 15",
  zip: "84036",
  city: "Kumhausen",
  country: "Deutschland",
  email: "stefandirnberger@viawen.com",
  phone: "",
  website: "",
  vatId: "",
  taxNumber: "69343720183",
  register: "Gewerbe 132/211/51474",
  iban: "",
  bic: "",
  bankName: "",
  taxRate: 19,
  paymentDays: 14,
  quotePrefix: "ANG",
  invoicePrefix: "RE",
  contractPrefix: "VER",
  quoteNote: "Das Angebot ist 14 Tage gültig. Alle Preise in EUR zzgl. gesetzlicher MwSt., sofern nicht anders ausgewiesen.",
  invoiceNote: "Leistungszeitraum entspricht dem Rechnungsdatum, sofern nicht anders angegeben.",
  contractNote: "Der Vertrag beginnt mit Unterzeichnung und verlängert sich um 12 Monate, wenn er nicht mit einer Frist von 30 Tagen gekündigt wird.",
  footer: "Stefan Dirnberger, Freiberufler · Lindenstr. 15, 84036 Kumhausen",
  defaultTemplate: "atelier",
  defaultUnit: "Stück",
  skontoPercent: 0,
  skontoDays: 0,
  quoteEmailSubject: "Angebot {number} – {company}",
  invoiceEmailSubject: "Rechnung {number} – {company}",
  contractEmailSubject: "Vertrag {number} – {company}",
  paypalUrl: "",
  stripePaymentUrl: "",
  paymentNote: "Bitte überweisen Sie den Betrag innerhalb der Zahlungsfrist unter Angabe der Rechnungsnummer.",
};

export function emptyBillingState(): BillingState {
  return {
    version: 2,
    company: DEFAULT_COMPANY,
    documents: [],
    reminders: [],
    sequences: { quote: 0, invoice: 0, contract: 0 },
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
