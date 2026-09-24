"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { logOpsEvent } from "@/lib/ops/events";
import { formatDocumentNumber } from "./calc";
import { applyDocumentLifecycle, coerceDocument } from "./coerce";
import { emptyBillingState, newLineItem, STORAGE_KEY } from "./defaults";
import { kindHref, kindLabel } from "./labels";
import { newPaymentToken } from "./payment";
import type {
  BillingState,
  BusinessDocument,
  CompanyProfile,
  DocumentKind,
  DocumentStatus,
  Reminder,
} from "./types";

type BillingContextValue = {
  ready: boolean;
  company: CompanyProfile;
  documents: BusinessDocument[];
  reminders: Reminder[];
  sequences: BillingState["sequences"];
  saveCompany: (company: CompanyProfile) => void;
  saveSequences: (sequences: BillingState["sequences"]) => void;
  commitDocument: (doc: BusinessDocument) => BusinessDocument;
  archiveDocument: (id: string) => void;
  restoreDocument: (id: string) => void;
  setDocumentStatus: (id: string, status: DocumentStatus) => void;
  duplicateDocument: (id: string) => BusinessDocument | null;
  convertQuoteToInvoice: (id: string) => BusinessDocument | null;
  convertQuoteToContract: (id: string) => BusinessDocument | null;
  blankDocument: (kind: DocumentKind) => BusinessDocument;
  addReminder: (reminder: Omit<Reminder, "id" | "createdAt" | "status"> & { status?: Reminder["status"] }) => Reminder;
  saveReminder: (reminder: Reminder) => void;
  completeReminder: (id: string) => void;
  replaceBilling: (next: BillingState) => void;
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

function withLifecycle(doc: BusinessDocument, asOf = today()): BusinessDocument {
  return applyDocumentLifecycle(doc, asOf);
}

function prefixFor(company: CompanyProfile, kind: DocumentKind): string {
  if (kind === "quote") return company.quotePrefix;
  if (kind === "invoice") return company.invoicePrefix;
  return company.contractPrefix;
}

function introFor(kind: DocumentKind): string {
  if (kind === "quote") return "Angebot für Ihre Anfrage.";
  if (kind === "invoice") return "Rechnung für erbrachte Leistungen.";
  return "Vertrag über die vereinbarten Leistungen.";
}

function noteFor(company: CompanyProfile, kind: DocumentKind): string {
  if (kind === "quote") return company.quoteNote;
  if (kind === "invoice") return company.invoiceNote;
  return company.contractNote;
}

function readState(): BillingState {
  const fallback = emptyBillingState();
  const hydrate = (state: BillingState): BillingState => ({
    ...state,
    documents: state.documents.map((doc) =>
      withLifecycle(coerceDocument({
        ...doc,
        paymentToken: doc.paymentToken || newPaymentToken(),
      })),
    ),
  });
  if (typeof window === "undefined") return hydrate(fallback);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return hydrate(fallback);
    const parsed = JSON.parse(raw) as BillingState;
    if (parsed.version !== 2 || !parsed.company || !Array.isArray(parsed.documents)) {
      return hydrate(fallback);
    }
    return hydrate({
      ...fallback,
      ...parsed,
      company: { ...fallback.company, ...parsed.company },
      sequences: { ...fallback.sequences, ...parsed.sequences },
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : fallback.reminders,
      documents: parsed.documents,
    });
  } catch {
    return hydrate(fallback);
  }
}

function writeState(state: BillingState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function subscribeHydration(onStoreChange: () => void) {
  queueMicrotask(onStoreChange);
  return () => undefined;
}

function bumpSequence(prev: BillingState, kind: DocumentKind) {
  const sequence = (prev.sequences[kind] ?? 0) + 1;
  return {
    sequence,
    prefix: prefixFor(prev.company, kind),
    sequences: { ...prev.sequences, [kind]: sequence },
  };
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
          const bumped = bumpSequence(prev, doc.kind);
          const year = new Date(doc.issueDate || Date.now()).getFullYear();
          number = formatDocumentNumber(bumped.prefix, year, bumped.sequence);
          nextSequences = bumped.sequences;
        }
        saved = withLifecycle({
          ...doc,
          number,
          paymentToken: doc.paymentToken || newPaymentToken(),
          sentAt: doc.status === "sent" || doc.status === "overdue" ? doc.sentAt || new Date().toISOString() : doc.sentAt,
          paidAt: doc.status === "paid" ? doc.paidAt || today() : doc.paidAt,
          lastMailedAt: doc.lastMailedAt ?? null,
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
      logOpsEvent({
        title: saved.number
          ? `${kindLabel(saved.kind)} ${saved.number} gespeichert`
          : `${kindLabel(saved.kind)} gespeichert`,
        href: `${kindHref(saved.kind)}/${saved.id}`,
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
        customerVatId: "",
        customerPhone: "",
        issueDate,
        dueDate: addDays(issueDate, kind === "contract" ? 365 : state.company.paymentDays),
        serviceDate: issueDate,
        intro: introFor(kind),
        notes: noteFor(state.company, kind),
        taxRate: state.company.taxRate,
        discountPercent: 0,
        currency: "EUR",
        items: [newLineItem(state.company.defaultUnit)],
        paymentToken: newPaymentToken(),
        sentAt: null,
        paidAt: null,
        lastMailedAt: null,
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
            ? { ...item, archivedAt: null, status: "draft", updatedAt: new Date().toISOString() }
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
          item.id === id
            ? withLifecycle({
                ...item,
                status,
                sentAt: status === "sent" || status === "overdue" ? item.sentAt || new Date().toISOString() : item.sentAt,
                paidAt: status === "paid" ? item.paidAt || today() : item.paidAt,
                updatedAt: new Date().toISOString(),
              })
            : item,
        ),
        reminders:
          status === "paid"
            ? prev.reminders.map((item) => (item.relatedId === id ? { ...item, status: "done" as const } : item))
            : prev.reminders,
      }));
      if (status === "paid") {
        logOpsEvent({ title: "Rechnung als bezahlt markiert", href: `/invoices/${id}` });
      }
      if (status === "accepted") {
        logOpsEvent({ title: "Angebot angenommen", href: `/quotes/${id}` });
      }
      if (status === "signed" || status === "active") {
        logOpsEvent({ title: "Vertrag unterzeichnet", href: `/contracts/${id}` });
      }
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
          dueDate: addDays(issueDate, source.kind === "contract" ? 365 : prev.company.paymentDays),
          items: source.items.map((item) => ({ ...item, id: crypto.randomUUID() })),
          paymentToken: newPaymentToken(),
          sentAt: null,
          paidAt: null,
          lastMailedAt: null,
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
        const bumped = bumpSequence(prev, "invoice");
        const year = new Date().getFullYear();
        const issueDate = today();
        invoice = {
          ...quote,
          id: crypto.randomUUID(),
          kind: "invoice",
          number: formatDocumentNumber(bumped.prefix, year, bumped.sequence),
          status: "draft",
          issueDate,
          dueDate: addDays(issueDate, prev.company.paymentDays),
          serviceDate: issueDate,
          intro: "Rechnung zu Ihrem angenommenen Angebot.",
          notes: prev.company.invoiceNote,
          items: quote.items.map((item) => ({ ...item, id: crypto.randomUUID() })),
          paymentToken: newPaymentToken(),
          sentAt: null,
          paidAt: null,
          lastMailedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          archivedAt: null,
          convertedFromId: quote.id,
        };
        return {
          ...prev,
          sequences: bumped.sequences,
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

  const convertQuoteToContract = useCallback(
    (id: string): BusinessDocument | null => {
      let contract: BusinessDocument | null = null;
      persist((prev) => {
        const quote = prev.documents.find((item) => item.id === id && item.kind === "quote");
        if (!quote) return prev;
        const bumped = bumpSequence(prev, "contract");
        const year = new Date().getFullYear();
        const issueDate = today();
        contract = {
          ...quote,
          id: crypto.randomUUID(),
          kind: "contract",
          number: formatDocumentNumber(bumped.prefix, year, bumped.sequence),
          status: "draft",
          issueDate,
          dueDate: addDays(issueDate, 365),
          serviceDate: issueDate,
          intro: "Vertrag zu Ihrem angenommenen Angebot.",
          notes: prev.company.contractNote,
          items: quote.items.map((item) => ({ ...item, id: crypto.randomUUID() })),
          paymentToken: newPaymentToken(),
          sentAt: null,
          paidAt: null,
          lastMailedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          archivedAt: null,
          convertedFromId: quote.id,
        };
        return {
          ...prev,
          sequences: bumped.sequences,
          documents: [contract, ...prev.documents],
        };
      });
      return contract;
    },
    [persist],
  );

  const addReminder = useCallback(
    (input: Omit<Reminder, "id" | "createdAt" | "status"> & { status?: Reminder["status"] }) => {
      const reminder: Reminder = {
        ...input,
        id: crypto.randomUUID(),
        status: input.status ?? "open",
        createdAt: new Date().toISOString(),
      };
      persist((prev) => ({ ...prev, reminders: [reminder, ...prev.reminders] }));
      logOpsEvent({ title: `Erinnerung: ${reminder.title}`, href: "/reminders" });
      return reminder;
    },
    [persist],
  );

  const saveReminder = useCallback(
    (reminder: Reminder) => {
      persist((prev) => ({
        ...prev,
        reminders: prev.reminders.some((item) => item.id === reminder.id)
          ? prev.reminders.map((item) => (item.id === reminder.id ? reminder : item))
          : [reminder, ...prev.reminders],
      }));
    },
    [persist],
  );

  const completeReminder = useCallback(
    (id: string) => {
      persist((prev) => {
        if (prev.reminders.some((item) => item.id === id)) {
          return {
            ...prev,
            reminders: prev.reminders.map((item) => (item.id === id ? { ...item, status: "done" as const } : item)),
          };
        }
        const match = /^derived-(quote|invoice|contract)-(.+)$/.exec(id);
        if (!match) return prev;
        const source = match[1] as Reminder["source"];
        const relatedId = match[2];
        const related = prev.documents.find((item) => item.id === relatedId);
        return {
          ...prev,
          reminders: [
            {
              id: crypto.randomUUID(),
              title: related ? `${related.number} erledigt` : "Erinnerung erledigt",
              note: "",
              dueDate: today(),
              status: "done",
              source,
              relatedId,
              customerName: related?.customerName ?? "",
              createdAt: new Date().toISOString(),
            },
            ...prev.reminders,
          ],
        };
      });
      logOpsEvent({ title: "Erinnerung erledigt", href: "/reminders" });
    },
    [persist],
  );

  const replaceBilling = useCallback(
    (next: BillingState) => {
      persist(() => ({
        version: 2,
        company: next.company,
        documents: next.documents.map((doc) => withLifecycle(coerceDocument(doc))),
        reminders: next.reminders,
        sequences: next.sequences,
      }));
    },
    [persist],
  );

  const value = useMemo<BillingContextValue>(
    () => ({
      ready,
      company: state.company,
      documents: state.documents,
      reminders: state.reminders,
      sequences: state.sequences,
      saveCompany,
      saveSequences,
      commitDocument,
      archiveDocument,
      restoreDocument,
      setDocumentStatus,
      duplicateDocument,
      convertQuoteToInvoice,
      convertQuoteToContract,
      blankDocument,
      addReminder,
      saveReminder,
      completeReminder,
      replaceBilling,
    }),
    [
      addReminder,
      archiveDocument,
      blankDocument,
      commitDocument,
      completeReminder,
      convertQuoteToContract,
      convertQuoteToInvoice,
      duplicateDocument,
      ready,
      replaceBilling,
      restoreDocument,
      saveCompany,
      saveReminder,
      saveSequences,
      setDocumentStatus,
      state.company,
      state.documents,
      state.reminders,
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
