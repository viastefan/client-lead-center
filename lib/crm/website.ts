export function domainFromWebsite(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const href = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return trimmed.replace(/^https?:\/\//, "").split("/")[0] ?? "";
  }
}

export function websiteHref(customer: { websiteUrl?: string; domain?: string }): string {
  const direct = customer.websiteUrl?.trim();
  if (direct) return direct.startsWith("http") ? direct : `https://${direct}`;
  const domain = customer.domain?.trim().replace(/^https?:\/\//, "");
  return domain ? `https://${domain}` : "";
}
