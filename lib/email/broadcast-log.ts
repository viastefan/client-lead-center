export type BroadcastLogEntry = {
  id: string;
  at: string;
  subject: string;
  dryRun: boolean;
  sent: number;
  failed: number;
  total: number;
};

export const BROADCAST_LOG_KEY = "clc.mail.broadcasts.v1";
const MAX = 30;
export const EMPTY_BROADCAST_LOG: BroadcastLogEntry[] = [];

let rawCache: string | null | undefined;
let snap: BroadcastLogEntry[] = EMPTY_BROADCAST_LOG;

export function readBroadcastLog(raw?: string | null): BroadcastLogEntry[] {
  if (!raw) return EMPTY_BROADCAST_LOG;
  try {
    const parsed = JSON.parse(raw) as BroadcastLogEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : EMPTY_BROADCAST_LOG;
  } catch {
    return EMPTY_BROADCAST_LOG;
  }
}

export function readBroadcastLogFromStorage(): BroadcastLogEntry[] {
  if (typeof window === "undefined") return EMPTY_BROADCAST_LOG;
  const raw = window.localStorage.getItem(BROADCAST_LOG_KEY);
  if (raw === rawCache) return snap;
  rawCache = raw;
  snap = readBroadcastLog(raw);
  return snap;
}

export function appendBroadcastLog(entry: BroadcastLogEntry) {
  if (typeof window === "undefined") return;
  const next = [entry, ...readBroadcastLogFromStorage()].slice(0, MAX);
  const raw = JSON.stringify(next);
  window.localStorage.setItem(BROADCAST_LOG_KEY, raw);
  rawCache = raw;
  snap = next;
  window.dispatchEvent(new Event("clc-mail-broadcasts"));
}

export function subscribeBroadcastLog(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("clc-mail-broadcasts", onStoreChange);
  return () => window.removeEventListener("clc-mail-broadcasts", onStoreChange);
}
