"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { formatDocumentNumber, isOverdueInvoice } from "./calc";
import { emptyBillingState, newLineItem, STORAGE_KEY } from "./defaults";
import type {
  BillingState,
  BusinessDocument,
  CompanyProfile,
  DocumentKind,
  DocumentStatus,
} from "./types";

type BillingContextValue = {
  ready: boolean;
  company: CompanyProfile;
  documents: BusinessDocument[];
  sequences: BillingState["sequences"];
  saveCompany: (company: CompanyProfile) => void;
  saveSequences: (sequences: BillingState["sequences"]) => void;
  commitDocument: (doc: BusinessDocument) => BusinessDocument;
  archiveDocument: (id: string) => void;
  restoreDocument: (id: string) => void;
  setDocumentStatus: (id: string, status: DocumentStatus) => void;
  duplicateDocument: (id: string) => BusinessDocument | null;
  convertQuoteToInvoice: (id: string) => BusinessDocument | null;
  blankDocument: (kind: DocumentKind) => BusinessDocument;
};

const BillingContext = createContext<BillingContextValue | null>(null);

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function withOverdue(doc: BusinessDocument, asOf = today()): BusinessDocument {
  if (!isOverdueInvoice(doc, asOf) || doc.status === "overdue") return doc;
  return { ...doc, status: "overdue" };
}

function readState(): BillingState {
  const fallback = emptyBillingState();
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as BillingState;
    if (parsed.version !== 1 || !parsed.company || !Array.isArray(parsed.documents)) {
      return fallback;
    }
    return {
      ...fallback,
      ...parsed,
      company: { ...fallback.company, ...parsed.company },
      sequences: { ...fallback.sequences, ...parsed.sequences },
      documents: parsed.documents.map((doc) => withOverdue(doc)),
    };
  } catch {
    return fallback;
  }
}

function writeState(state: BillingState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function subscribeHydration() {
  return () => undefined;
}

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const ready = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const [tick, setTick] = useState(0);
  const state = ready && tick >= 0 ? readState() : emptyBillingState();

  const persist = useCallback((updater: (prev: BillingState) => BillingState) => {
    const next = updater(readState());
    writeState(next);
    setTick((value) => value + 1);
    return next;
  }, []);

  const saveCompany = useCallback(
    (company: CompanyProfile) => {
      persist((prev) => ({ ...prev, company }));
    },
    [persist],
  );

  const saveSequences = useCallback(
    (sequences: BillingState["sequences"]) => {
      persist((prev) => ({ ...prev, sequences }));
    },
    [persist],
  );

  const commitDocument = useCallback(
    (doc: BusinessDocument) => {
      let saved = doc;
      persist((prev) => {
        const exists = prev.documents.some((item) => item.id === doc.id);
        let nextSequences = prev.sequences;
        let number = doc.number;
        if (!number) {
          const sequence = (doc.kind === "quote" ? prev.sequences.quote : prev.sequences.invoice) + 1;
          const prefix = doc.kind === "quote" ? prev.company.quotePrefix : prev.company.invoicePrefix;
          const year = new Date(doc.issueDate || Date.now()).getFullYear();
          number = formatDocumentNumber(prefix, year, sequence);
          nextSequences = {
            quote: doc.kind === "quote" ? sequence : prev.sequences.quote,
            invoice: doc.kind === "invoice" ? sequence : prev.sequences.invoice,
          };
        }
        saved = withOverdue({
          ...doc,
          number,
          updatedAt: new Date().toISOString(),
        });
        return {
          ...prev,
          sequences: nextSequences,
          documents: exists
            ? prev.documents.map((item) => (item.id === doc.id ? saved : item))
            : [saved, ...prev.documents],
        };
      });
      return saved;
    },
    [persist],
  );

  const blankDocument = useCallback(
    (kind: DocumentKind): BusinessDocument => {
      const issueDate = today();
      return {
        id: crypto.randomUUID(),
        kind,
        number: "",
        status: "draft",
        templateId: state.company.defaultTemplate,
        customerId: "",
        customerName: "",
        customerContact: "",
        customerEmail: "",
        customerAddress: "",
        issueDate,
        dueDate: addDays(issueDate, state.company.paymentDays),
        intro: kind === "quote" ? "Angebot für Ihre Anfrage." : "Rechnung für erbrachte Leistungen.",
        notes: kind === "quote" ? state.company.quoteNote : state.company.invoiceNote,
        taxRate: state.company.taxRate,
        currency: "EUR",
        items: [newLineItem(state.company.defaultUnit)],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archivedAt: null,
        convertedFromId: null,
      };
    },
    [state.company],
  );

  const archiveDocument = useCallback(
    (id: string) => {
      persist((prev) => ({
        ...prev,
        documents: prev.documents.map((item) =>
          item.id === id
            ? { ...item, status: "archived", archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
            : item,
        ),
      }));
    },
    [persist],
  );

  const restoreDocument = useCallback(
    (id: string) => {
      persist((prev) => ({
        ...prev,
        documents: prev.documents.map((item) =>
          item.id === id
            ? {
                ...item,
                archivedAt: null,
                status: item.kind === "invoice" ? "draft" : "draft",
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      }));
    },
    [persist],
  );

  const setDocumentStatus = useCallback(
    (id: string, status: DocumentStatus) => {
      persist((prev) => ({
        ...prev,
        documents: prev.documents.map((item) =>
          item.id === id ? withOverdue({ ...item, status, updatedAt: new Date().toISOString() }) : item,
        ),
      }));
    },
    [persist],
  );

  const duplicateDocument = useCallback(
    (id: string) => {
      let copy: BusinessDocument | null = null;
      persist((prev) => {
        const source = prev.documents.find((item) => item.id === id);
        if (!source) return prev;
        const issueDate = today();
        copy = {
          ...source,
          id: crypto.randomUUID(),
          number: "",
          status: "draft",
          issueDate,
          dueDate: addDays(issueDate, prev.company.paymentDays),
          items: source.items.map((item) => ({ ...item, id: crypto.randomUUID() })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          archivedAt: null,
          convertedFromId: null,
        };
        return { ...prev, documents: [copy, ...prev.documents] };
      });
      return copy;
    },
    [persist],
  );

  const convertQuoteToInvoice = useCallback(
    (id: string): BusinessDocument | null => {
      let invoice: BusinessDocument | null = null;
      persist((prev) => {
        const quote = prev.documents.find((item) => item.id === id && item.kind === "quote");
        if (!quote) return prev;
        const year = new Date().getFullYear();
        const sequence = prev.sequences.invoice + 1;
        const issueDate = today();
        invoice = {
          ...quote,
          id: crypto.randomUUID(),
          kind: "invoice",
          number: formatDocumentNumber(prev.company.invoicePrefix, year, sequence),
          status: "draft",
          issueDate,
          dueDate: addDays(issueDate, prev.company.paymentDays),
          intro: "Rechnung zu Ihrem angenommenen Angebot.",
          notes: prev.company.invoiceNote,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          archivedAt: null,
          convertedFromId: quote.id,
        };
        return {
          ...prev,
          sequences: { ...prev.sequences, invoice: sequence },
          documents: [
            invoice,
            ...prev.documents.map((item) =>
              item.id === quote.id
                ? { ...item, status: "invoiced" as DocumentStatus, updatedAt: new Date().toISOString() }
                : item,
            ),
          ],
        };
      });
      return invoice;
    },
    [persist],
  );

  const value = useMemo<BillingContextValue>(
    () => ({
      ready,
      company: state.company,
      documents: state.documents,
      sequences: state.sequences,
      saveCompany,
      saveSequences,
      commitDocument,
      archiveDocument,
      restoreDocument,
      setDocumentStatus,
      duplicateDocument,
      convertQuoteToInvoice,
      blankDocument,
    }),
    [
      archiveDocument,
      blankDocument,
      commitDocument,
      convertQuoteToInvoice,
      duplicateDocument,
      ready,
      restoreDocument,
      saveCompany,
      saveSequences,
      setDocumentStatus,
      state.company,
      state.documents,
      state.sequences,
    ],
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling(): BillingContextValue {
  const value = useContext(BillingContext);
  if (!value) {
    throw new Error("useBilling must be used within BillingProvider");
  }
  return value;
}
