export const DOCUMENT_KINDS = ["quote", "invoice"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const DOCUMENT_STATUSES = [
  "draft",
  "sent",
  "accepted",
  "declined",
  "invoiced",
  "paid",
  "overdue",
  "archived",
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const TEMPLATE_IDS = ["atelier", "linear", "noir"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export type LineItem = {
  id: string;
  title: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
};

export type CompanyProfile = {
  legalName: string;
  tradeName: string;
  ownerName: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  website: string;
  vatId: string;
  taxNumber: string;
  register: string;
  iban: string;
  bic: string;
  bankName: string;
  taxRate: number;
  paymentDays: number;
  quotePrefix: string;
  invoicePrefix: string;
  quoteNote: string;
  invoiceNote: string;
  footer: string;
  defaultTemplate: TemplateId;
  defaultUnit: string;
  skontoPercent: number;
  skontoDays: number;
  quoteEmailSubject: string;
  invoiceEmailSubject: string;
};

export type BusinessDocument = {
  id: string;
  kind: DocumentKind;
  number: string;
  status: DocumentStatus;
  templateId: TemplateId;
  customerId: string;
  customerName: string;
  customerContact: string;
  customerEmail: string;
  customerAddress: string;
  issueDate: string;
  dueDate: string;
  intro: string;
  notes: string;
  taxRate: number;
  currency: "EUR";
  items: LineItem[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  convertedFromId: string | null;
};

export type BillingState = {
  version: 1;
  company: CompanyProfile;
  documents: BusinessDocument[];
  sequences: {
    quote: number;
    invoice: number;
  };
};
