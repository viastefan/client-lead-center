export const MAILBOX_USER_KEY = "clc.mailbox.user";
export const MAILBOX_HOST_KEY = "clc.mailbox.host";
export const MAILBOX_PORT_KEY = "clc.mailbox.port";
export const MAILBOX_PASS_KEY = "clc.mail.pass";

export type MailboxClientConfig = {
  username?: string;
  host?: string;
  port?: number;
  password?: string;
};

export function readMailboxClient(): MailboxClientConfig {
  if (typeof window === "undefined") return {};
  const portRaw = window.localStorage.getItem(MAILBOX_PORT_KEY);
  return {
    username: window.localStorage.getItem(MAILBOX_USER_KEY) || undefined,
    host: window.localStorage.getItem(MAILBOX_HOST_KEY) || undefined,
    port: portRaw ? Number(portRaw) || undefined : undefined,
    password: window.sessionStorage.getItem(MAILBOX_PASS_KEY) || undefined,
  };
}

export function writeMailboxClient(input: { username?: string; host?: string; port?: number; password?: string }) {
  if (typeof window === "undefined") return;
  if (input.username !== undefined) window.localStorage.setItem(MAILBOX_USER_KEY, input.username);
  if (input.host !== undefined) window.localStorage.setItem(MAILBOX_HOST_KEY, input.host);
  if (input.port !== undefined) window.localStorage.setItem(MAILBOX_PORT_KEY, String(input.port));
  if (input.password) window.sessionStorage.setItem(MAILBOX_PASS_KEY, input.password);
}

export function mailboxPayload(extra: Record<string, unknown> = {}) {
  const config = readMailboxClient();
  return {
    ...extra,
    host: config.host,
    port: config.port ?? 465,
    username: config.username,
    password: config.password,
  };
}
