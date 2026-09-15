export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(value));
}

export function leadStatusLabel(status: string): string {
  switch (status) {
    case "new":
      return "Neu";
    case "in_progress":
      return "In Bearbeitung";
    case "waiting":
      return "Warten";
    case "replied":
      return "Beantwortet";
    case "qualified":
      return "Qualified";
    case "closed":
      return "Geschlossen";
    case "spam":
      return "Spam";
    default:
      return status;
  }
}

export function priorityLabel(priority: string): string {
  switch (priority) {
    case "low":
      return "Niedrig";
    case "normal":
      return "Normal";
    case "high":
      return "Hoch";
    case "urgent":
      return "Dringend";
    default:
      return priority;
  }
}

export function customerStatusLabel(status: string): string {
  return status === "active" ? "Aktiv" : "Inaktiv";
}

export function websiteStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Aktiv";
    case "inactive":
      return "Inaktiv";
    case "error":
      return "Fehler";
    default:
      return status;
  }
}

export function emailStatusLabel(status: string): string {
  switch (status) {
    case "connected":
      return "Verbunden";
    case "disconnected":
      return "Getrennt";
    case "error":
      return "Fehler";
    default:
      return status;
  }
}

export function healthLabel(status: string): string {
  switch (status) {
    case "operational":
      return "Operational";
    case "warning":
      return "Warning";
    case "error":
      return "Error";
    default:
      return status;
  }
}

export function domainHost(domain: string): string {
  return domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}
