import nodemailer from "nodemailer";
import { getIonosSmtp } from "@/lib/env";
import { IONOS_DEFAULTS } from "./ionos-config";

export type SmtpAccount = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName?: string;
};

export { IONOS_DEFAULTS };

export function resolveSmtpAccount(override?: Partial<SmtpAccount> & { password?: string }): SmtpAccount | null {
  const env = getIonosSmtp();
  const host = override?.host || env?.host || IONOS_DEFAULTS.host;
  const port = override?.port || env?.port || IONOS_DEFAULTS.port;
  const username = override?.username || env?.username || "";
  const password = override?.password || env?.password || "";
  const fromName = override?.fromName || env?.fromName;
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

function transport(account: SmtpAccount) {
  return nodemailer.createTransport({
    host: account.host,
    port: account.port,
    secure: account.secure,
    auth: {
      user: account.username,
      pass: account.password,
    },
    tls: {
      minVersion: "TLSv1.2",
    },
  });
}

export async function verifySmtp(account: SmtpAccount): Promise<void> {
  const mailer = transport(account);
  try {
    await mailer.verify();
  } finally {
    mailer.close();
  }
}

export async function sendSmtpMail(
  account: SmtpAccount,
  input: { to: string; subject: string; text: string },
): Promise<void> {
  const mailer = transport(account);
  try {
    await mailer.sendMail({
      from: account.fromName ? `"${account.fromName}" <${account.username}>` : account.username,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
  } finally {
    mailer.close();
  }
}
