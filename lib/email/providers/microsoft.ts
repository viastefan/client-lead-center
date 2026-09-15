import type { MailboxAdapter, MailboxConnection } from "@/lib/email/types";
import { NotImplementedMailboxError } from "@/lib/email/types";

export const microsoftAdapter: MailboxAdapter = {
  provider: "microsoft",
  async getAuthorizeUrl() {
    throw new NotImplementedMailboxError("microsoft");
  },
  async handleCallback(): Promise<MailboxConnection> {
    throw new NotImplementedMailboxError("microsoft");
  },
  async sendEmail() {
    throw new NotImplementedMailboxError("microsoft");
  },
};
