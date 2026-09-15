export type MailboxProvider = "gmail" | "microsoft";

export type MailboxConnection = {
  provider: MailboxProvider;
  email: string;
  status: "connected" | "disconnected" | "error";
};

export interface MailboxAdapter {
  provider: MailboxProvider;
  getAuthorizeUrl(customerId: string): Promise<string>;
  handleCallback(code: string, customerId: string): Promise<MailboxConnection>;
  sendEmail(input: {
    customerId: string;
    to: string;
    subject: string;
    body: string;
  }): Promise<void>;
}

export class NotImplementedMailboxError extends Error {
  constructor(provider: MailboxProvider) {
    super(`${provider} OAuth is prepared but not enabled in V1.`);
    this.name = "NotImplementedMailboxError";
  }
}
