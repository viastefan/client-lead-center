import type { SiteProbe } from "@/lib/ops/monitor";
import type { HealthComponentStatus } from "@/types";

export const MONITOR_CACHE_KEY = "clc.monitor.sites.v1";
export const MONITOR_EVENT = "clc-monitor";

export type MonitorCache = {
  checkedAt: string;
  up: number;
  total: number;
  sites: SiteProbe[];
  health?: {
    status: string;
    timestamp: string;
    components: Record<string, HealthComponentStatus>;
  };
};

export function readMonitorCache(): MonitorCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(MONITOR_CACHE_KEY);
    return raw ? (JSON.parse(raw) as MonitorCache) : null;
  } catch {
    return null;
  }
}

export function writeMonitorCache(payload: MonitorCache) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(MONITOR_CACHE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event(MONITOR_EVENT));
}

export function subscribeMonitorCache(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(MONITOR_EVENT, onStoreChange);
  return () => window.removeEventListener(MONITOR_EVENT, onStoreChange);
}
