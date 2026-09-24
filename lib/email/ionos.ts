import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { ApiError } from "@/lib/api/errors";
import { getIonosSmtp } from "@/lib/env";
import { IONOS_DEFAULTS } from "./ionos-config";
import {
  ionosApiKeyHint,
  isSmtpAuthFailure,
  looksLikeIonosDeveloperKey,
  smtpUserMessage,
} from "./smtp-errors";

export type SmtpAccount = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName?: string;
};

export { IONOS_DEFAULTS };

const SMTP_TIMEOUT_MS = 12_000;

export function resolveSmtpAccount(override?: Partial<SmtpAccount> & { password?: string }): SmtpAccount | null {
  const env = getIonosSmtp();
  const host = override?.host || env?.host || IONOS_DEFAULTS.host;
  const port = override?.port || env?.port || IONOS_DEFAULTS.port;
  const username = override?.username || env?.username || "";
  const password = override?.password || env?.password || "";
  const fromName = override?.fromName || env?.fromName || "Stefan Dirnberger";
  if (!username || !password) return null;
  return {
    host,
    port,
    secure: port === 465,
    username,
    password,
    fromName,
  };
}

function isIonosHost(host: string): boolean {
  return /ionos\.(de|com)$/i.test(host) || /1and1\.(de|com)$/i.test(host);
}

export function accountVariants(account: SmtpAccount): SmtpAccount[] {
  const host = account.host || IONOS_DEFAULTS.host;
  const fromName = account.fromName || "Stefan Dirnberger";
  const base = { ...account, host, fromName, username: account.username.trim() };
  if (!isIonosHost(host)) {
    return [{ ...base, secure: base.port === 465 }];
  }
  const preferred = account.port === 587 ? [587, 465] : [465, 587];
  return preferred.map((port) => ({
    ...base,
    port,
    secure: port === 465,
  }));
}

function transport(account: SmtpAccount) {
  return nodemailer.createTransport({
    host: account.host,
    port: account.port,
    secure: account.secure,
    requireTLS: account.port === 587,
    auth: {
      user: account.username,
      pass: account.password,
    },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
    tls: {
      minVersion: "TLSv1.2",
      servername: account.host,
    },
  });
}

async function withWorkingTransport<T>(account: SmtpAccount, run: (mailer: Transporter) => Promise<T>): Promise<T> {
  if (looksLikeIonosDeveloperKey(account.password)) {
    throw new ApiError(400, "BAD_REQUEST", ionosApiKeyHint());
  }

  const variants = accountVariants(account);
  let lastError: unknown;
  for (const variant of variants) {
    const mailer = transport(variant);
    try {
      return await run(mailer);
    } catch (error) {
      lastError = error;
      if (isSmtpAuthFailure(error)) break;
    } finally {
      mailer.close();
    }
  }

  if (lastError instanceof ApiError) throw lastError;
  throw new ApiError(500, "INTERNAL_ERROR", smtpUserMessage(lastError));
}

export async function verifySmtp(account: SmtpAccount): Promise<void> {
  await withWorkingTransport(account, async (mailer) => {
    await mailer.verify();
  });
}

export async function sendSmtpMail(
  account: SmtpAccount,
  input: { to: string; subject: string; text: string; html?: string },
): Promise<void> {
  await withWorkingTransport(account, async (mailer) => {
    await mailer.sendMail({
      from: account.fromName ? `"${account.fromName}" <${account.username}>` : account.username,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  });
}
