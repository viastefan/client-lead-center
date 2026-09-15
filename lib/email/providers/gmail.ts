import type { MailboxAdapter, MailboxConnection } from "@/lib/email/types";
import { NotImplementedMailboxError } from "@/lib/email/types";

export const gmailAdapter: MailboxAdapter = {
  provider: "gmail",
  async getAuthorizeUrl() {
    throw new NotImplementedMailboxError("gmail");
  },
  async handleCallback(): Promise<MailboxConnection> {
    throw new NotImplementedMailboxError("gmail");
  },
  async sendEmail() {
    throw new NotImplementedMailboxError("gmail");
  },
};
