export type OpsEvent = {
  id: string;
  at: string;
  title: string;
  href?: string;
};

export const OPS_EVENTS_KEY = "clc.ops.events.v1";
export const EMPTY_OPS_EVENTS: OpsEvent[] = [];
const MAX = 40;

export function readOpsEvents(raw?: string | null): OpsEvent[] {
  if (!raw) return EMPTY_OPS_EVENTS;
  try {
    const parsed = JSON.parse(raw) as OpsEvent[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : EMPTY_OPS_EVENTS;
  } catch {
    return EMPTY_OPS_EVENTS;
  }
}

export function appendOpsEvent(events: OpsEvent[], event: Omit<OpsEvent, "id" | "at"> & { id?: string; at?: string }): OpsEvent[] {
  const next: OpsEvent = {
    id: event.id ?? crypto.randomUUID(),
    at: event.at ?? new Date().toISOString(),
    title: event.title,
    href: event.href,
  };
  return [next, ...events].slice(0, MAX);
}

export function logOpsEvent(event: Omit<OpsEvent, "id" | "at"> & { id?: string; at?: string }) {
  if (typeof window === "undefined") return;
  const events = appendOpsEvent(readOpsEvents(window.localStorage.getItem(OPS_EVENTS_KEY)), event);
  const raw = JSON.stringify(events);
  window.localStorage.setItem(OPS_EVENTS_KEY, raw);
  eventsRaw = raw;
  eventsSnap = events;
  window.dispatchEvent(new Event("clc-ops-events"));
}

let eventsRaw: string | null | undefined;
let eventsSnap: OpsEvent[] = EMPTY_OPS_EVENTS;

export function readOpsEventsFromStorage(): OpsEvent[] {
  if (typeof window === "undefined") return EMPTY_OPS_EVENTS;
  const raw = window.localStorage.getItem(OPS_EVENTS_KEY);
  if (raw === eventsRaw) return eventsSnap;
  eventsRaw = raw;
  eventsSnap = readOpsEvents(raw);
  return eventsSnap;
}

export function subscribeOpsEvents(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("clc-ops-events", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("clc-ops-events", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}
