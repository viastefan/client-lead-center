export type OpsEvent = {
  id: string;
  at: string;
  title: string;
  href?: string;
};

export const OPS_EVENTS_KEY = "clc.ops.events.v1";
const MAX = 40;

export function readOpsEvents(raw?: string | null): OpsEvent[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as OpsEvent[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
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
  window.localStorage.setItem(OPS_EVENTS_KEY, JSON.stringify(events));
  window.dispatchEvent(new Event("clc-ops-events"));
}

export function readOpsEventsFromStorage(): OpsEvent[] {
  if (typeof window === "undefined") return [];
  return readOpsEvents(window.localStorage.getItem(OPS_EVENTS_KEY));
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
